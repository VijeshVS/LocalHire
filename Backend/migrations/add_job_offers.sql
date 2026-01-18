-- =============================================
-- Job Offers & Scheduling Conflict Prevention
-- Run this in your Supabase SQL Editor
-- =============================================

-- Create job_offers table to track multiple employers offering same job
CREATE TABLE IF NOT EXISTS job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL,
    offer_status VARCHAR(20) DEFAULT 'pending' CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired')),
    offered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_application_id, employee_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_offers_employee ON job_offers(employee_id, offer_status);
CREATE INDEX IF NOT EXISTS idx_job_offers_employer ON job_offers(employer_id, offer_status);
CREATE INDEX IF NOT EXISTS idx_job_offers_expires ON job_offers(expires_at) WHERE offer_status = 'pending';

-- Function to check if worker is available for a specific time slot
CREATE OR REPLACE FUNCTION is_worker_available(
    worker_id UUID,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check if worker has any accepted jobs during this time period
    SELECT COUNT(*)
    INTO conflict_count
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_posting_id = jp.id
    WHERE ja.employee_id = worker_id
        AND ja.status = 'accepted'
        AND ja.work_status IN ('in_progress', 'pending')
        AND jp.scheduled_date IS NOT NULL
        AND jp.scheduled_start_time IS NOT NULL
        AND jp.scheduled_end_time IS NOT NULL
        -- Check for time overlap
        AND (
            (jp.scheduled_date + jp.scheduled_start_time) < end_time
            AND (jp.scheduled_date + jp.scheduled_end_time) > start_time
        );
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get worker's schedule conflicts
CREATE OR REPLACE FUNCTION get_worker_schedule_conflicts(
    worker_id UUID,
    check_date DATE
)
RETURNS TABLE (
    job_id UUID,
    job_title TEXT,
    employer_name TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.id as job_id,
        jp.title as job_title,
        e.name as employer_name,
        (jp.scheduled_date + jp.scheduled_start_time)::TIMESTAMP WITH TIME ZONE as start_time,
        (jp.scheduled_date + jp.scheduled_end_time)::TIMESTAMP WITH TIME ZONE as end_time,
        ja.status::TEXT
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_posting_id = jp.id
    JOIN employers e ON jp.employer_id = e.id
    WHERE ja.employee_id = worker_id
        AND ja.status = 'accepted'
        AND jp.scheduled_date = check_date
        AND jp.scheduled_start_time IS NOT NULL
        AND jp.scheduled_end_time IS NOT NULL
    ORDER BY jp.scheduled_start_time;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-expire old job offers
CREATE OR REPLACE FUNCTION expire_old_job_offers()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-expire offers that have passed their expiration time
    UPDATE job_offers
    SET offer_status = 'expired'
    WHERE offer_status = 'pending'
        AND expires_at < NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs periodically (you can also call this manually)
DROP TRIGGER IF EXISTS trigger_expire_job_offers ON job_offers;
CREATE TRIGGER trigger_expire_job_offers
    AFTER INSERT OR UPDATE ON job_offers
    FOR EACH STATEMENT
    EXECUTE FUNCTION expire_old_job_offers();

-- Function to create job offer when employer accepts application
CREATE OR REPLACE FUNCTION create_job_offer_on_accept()
RETURNS TRIGGER AS $$
DECLARE
    emp_id UUID;
BEGIN
    -- Only create offer when status changes to 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Get employer_id from job_posting
        SELECT employer_id INTO emp_id
        FROM job_postings
        WHERE id = NEW.job_posting_id;
        
        -- Create job offer
        INSERT INTO job_offers (
            job_application_id,
            job_posting_id,
            employee_id,
            employer_id,
            offer_status,
            offered_at
        ) VALUES (
            NEW.id,
            NEW.job_posting_id,
            NEW.employee_id,
            emp_id,
            'pending',
            NOW()
        )
        ON CONFLICT (job_application_id, employee_id) 
        DO UPDATE SET 
            offer_status = 'pending',
            offered_at = NOW(),
            expires_at = NOW() + INTERVAL '24 hours';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto job offer creation
DROP TRIGGER IF EXISTS trigger_create_job_offer ON job_applications;
CREATE TRIGGER trigger_create_job_offer
    AFTER INSERT OR UPDATE OF status ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_job_offer_on_accept();

-- View to see all pending job offers for workers with conflict checking
CREATE OR REPLACE VIEW worker_job_offers AS
SELECT 
    jo.id as offer_id,
    jo.employee_id,
    jo.job_application_id,
    jp.id as job_id,
    jp.title as job_title,
    jp.description,
    jp.wage,
    jp.duration,
    jp.scheduled_date,
    jp.scheduled_start_time,
    jp.scheduled_end_time,
    jp.address,
    jp.category,
    e.name as employer_name,
    e.business_name as employer_business,
    e.phone as employer_phone,
    jo.offer_status,
    jo.offered_at,
    jo.expires_at,
    CASE 
        WHEN jo.expires_at < NOW() THEN true
        ELSE false
    END as is_expired,
    -- Check if worker is available for this time slot
    CASE 
        WHEN jp.scheduled_date IS NOT NULL 
             AND jp.scheduled_start_time IS NOT NULL 
             AND jp.scheduled_end_time IS NOT NULL THEN
            is_worker_available(
                jo.employee_id,
                (jp.scheduled_date + jp.scheduled_start_time)::TIMESTAMP WITH TIME ZONE,
                (jp.scheduled_date + jp.scheduled_end_time)::TIMESTAMP WITH TIME ZONE
            )
        ELSE true
    END as is_available
FROM job_offers jo
JOIN job_postings jp ON jo.job_posting_id = jp.id
JOIN employers e ON jp.employer_id = e.id
WHERE jo.offer_status = 'pending';

COMMENT ON VIEW worker_job_offers IS 'Shows all pending job offers for workers with availability checking';

-- Function to accept job offer (with conflict validation)
CREATE OR REPLACE FUNCTION accept_job_offer(offer_id_param UUID, worker_id_param UUID)
RETURNS JSON AS $$
DECLARE
    offer_record RECORD;
    is_available BOOLEAN;
    result JSON;
BEGIN
    -- Get offer details
    SELECT * INTO offer_record
    FROM job_offers jo
    JOIN job_postings jp ON jo.job_posting_id = jp.id
    WHERE jo.id = offer_id_param
        AND jo.employee_id = worker_id_param
        AND jo.offer_status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Job offer not found or already processed'
        );
    END IF;
    
    -- Check if offer expired
    IF offer_record.expires_at < NOW() THEN
        UPDATE job_offers SET offer_status = 'expired' WHERE id = offer_id_param;
        RETURN json_build_object(
            'success', false,
            'error', 'Job offer has expired'
        );
    END IF;
    
    -- Check availability if job has schedule
    IF offer_record.scheduled_date IS NOT NULL THEN
        SELECT is_worker_available(
            worker_id_param,
            (offer_record.scheduled_date + offer_record.scheduled_start_time)::TIMESTAMP WITH TIME ZONE,
            (offer_record.scheduled_date + offer_record.scheduled_end_time)::TIMESTAMP WITH TIME ZONE
        ) INTO is_available;
        
        IF NOT is_available THEN
            RETURN json_build_object(
                'success', false,
                'error', 'You have a scheduling conflict with another job during this time'
            );
        END IF;
    END IF;
    
    -- Accept this offer
    UPDATE job_offers
    SET offer_status = 'accepted',
        responded_at = NOW()
    WHERE id = offer_id_param;
    
    -- Reject all other pending offers for this worker that conflict
    UPDATE job_offers jo
    SET offer_status = 'rejected',
        responded_at = NOW()
    WHERE jo.employee_id = worker_id_param
        AND jo.id != offer_id_param
        AND jo.offer_status = 'pending'
        AND EXISTS (
            SELECT 1 FROM job_postings jp
            WHERE jp.id = jo.job_posting_id
                AND jp.scheduled_date = offer_record.scheduled_date
                AND jp.scheduled_start_time < offer_record.scheduled_end_time
                AND jp.scheduled_end_time > offer_record.scheduled_start_time
        );
    
    -- Update job application work_status
    UPDATE job_applications
    SET work_status = 'in_progress',
        started_at = CASE 
            WHEN started_at IS NULL THEN NOW()
            ELSE started_at
        END
    WHERE id = offer_record.job_application_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Job offer accepted successfully',
        'offer_id', offer_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Function to reject job offer
CREATE OR REPLACE FUNCTION reject_job_offer(offer_id_param UUID, worker_id_param UUID)
RETURNS JSON AS $$
BEGIN
    UPDATE job_offers
    SET offer_status = 'rejected',
        responded_at = NOW()
    WHERE id = offer_id_param
        AND employee_id = worker_id_param
        AND offer_status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Job offer not found or already processed'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Job offer rejected'
    );
END;
$$ LANGUAGE plpgsql;

-- Add notification for new job offers
COMMENT ON TABLE job_offers IS 'Tracks job offers from employers to workers, allows workers to choose between multiple offers';
