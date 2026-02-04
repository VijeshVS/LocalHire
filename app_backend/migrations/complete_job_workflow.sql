-- =============================================
-- COMPLETE JOB WORKFLOW SYSTEM
-- Run this ENTIRE file in Supabase SQL Editor
-- =============================================

-- ============ STEP 1: Create job_offers table ============
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

CREATE INDEX IF NOT EXISTS idx_job_offers_employee ON job_offers(employee_id, offer_status);
CREATE INDEX IF NOT EXISTS idx_job_offers_employer ON job_offers(employer_id, offer_status);
CREATE INDEX IF NOT EXISTS idx_job_offers_expires ON job_offers(expires_at) WHERE offer_status = 'pending';

-- ============ STEP 2: Add busy time tracking to employees ============
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS busy_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_job_id UUID REFERENCES job_postings(id);

CREATE INDEX IF NOT EXISTS idx_employees_busy_until ON employees(busy_until) WHERE busy_until IS NOT NULL;

-- ============ STEP 3: Add scheduling to job_postings ============
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_start_time TIME,
ADD COLUMN IF NOT EXISTS scheduled_end_time TIME,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS expected_completion_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_job_postings_scheduled_date ON job_postings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_job_postings_expected_completion ON job_postings(expected_completion_at) WHERE expected_completion_at IS NOT NULL;

-- ============ STEP 4: Enhance job_applications ============
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS work_status VARCHAR(20) DEFAULT 'pending' CHECK (work_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS employer_rating INTEGER CHECK (employer_rating >= 1 AND employer_rating <= 5),
ADD COLUMN IF NOT EXISTS employer_review TEXT,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS employer_confirmation_pending BOOLEAN DEFAULT FALSE;

-- ============ STEP 5: Function to check worker availability ============
CREATE OR REPLACE FUNCTION is_worker_available(
    worker_id UUID,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
    worker_busy_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if worker is currently marked as busy
    SELECT busy_until INTO worker_busy_until
    FROM employees
    WHERE id = worker_id;
    
    IF worker_busy_until IS NOT NULL AND worker_busy_until > start_time THEN
        RETURN FALSE;
    END IF;
    
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
        AND (
            (jp.scheduled_date + jp.scheduled_start_time) < end_time
            AND (jp.scheduled_date + jp.scheduled_end_time) > start_time
        );
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============ STEP 6: Auto-calculate expected completion ============
CREATE OR REPLACE FUNCTION calculate_expected_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_end_time IS NOT NULL THEN
        NEW.expected_completion_at := (NEW.scheduled_date + NEW.scheduled_end_time)::TIMESTAMP WITH TIME ZONE;
    ELSE
        NEW.expected_completion_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_expected_completion ON job_postings;
CREATE TRIGGER trigger_calculate_expected_completion
    BEFORE INSERT OR UPDATE OF scheduled_date, scheduled_end_time ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_expected_completion();

-- ============ STEP 7: Auto-expire old job offers ============
CREATE OR REPLACE FUNCTION expire_old_job_offers()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE job_offers
    SET offer_status = 'expired'
    WHERE offer_status = 'pending'
        AND expires_at < NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_expire_job_offers ON job_offers;
CREATE TRIGGER trigger_expire_job_offers
    AFTER INSERT OR UPDATE ON job_offers
    FOR EACH STATEMENT
    EXECUTE FUNCTION expire_old_job_offers();

-- ============ STEP 8: Create job offer when employer accepts ============
CREATE OR REPLACE FUNCTION create_job_offer_on_accept()
RETURNS TRIGGER AS $$
DECLARE
    emp_id UUID;
    existing_offer_id UUID;
BEGIN
    -- Only create offer when status changes to 'accepted' from a non-accepted status
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Check if offer already exists to prevent duplicates
        SELECT id INTO existing_offer_id
        FROM job_offers
        WHERE job_application_id = NEW.id
          AND employee_id = NEW.employee_id;
        
        -- Only proceed if no offer exists yet
        IF existing_offer_id IS NULL THEN
            SELECT employer_id INTO emp_id
            FROM job_postings
            WHERE id = NEW.job_posting_id;
            
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_job_offer ON job_applications;
CREATE TRIGGER trigger_create_job_offer
    AFTER INSERT OR UPDATE OF status ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_job_offer_on_accept();

-- ============ STEP 9: Worker job offers view ============
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

-- ============ STEP 10: Accept job offer function (with busy time) ============
CREATE OR REPLACE FUNCTION accept_job_offer(offer_id_param UUID, worker_id_param UUID)
RETURNS JSON AS $$
DECLARE
    offer_record RECORD;
    is_available BOOLEAN;
    result JSON;
BEGIN
    SELECT jo.*, jp.scheduled_date, jp.scheduled_start_time, jp.scheduled_end_time, 
           jp.expected_completion_at, jp.id as posting_id
    INTO offer_record
    FROM job_offers jo
    JOIN job_postings jp ON jo.job_posting_id = jp.id
    WHERE jo.id = offer_id_param
        AND jo.employee_id = worker_id_param
        AND jo.offer_status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Job offer not found or already processed');
    END IF;
    
    IF offer_record.expires_at < NOW() THEN
        UPDATE job_offers SET offer_status = 'expired' WHERE id = offer_id_param;
        RETURN json_build_object('success', false, 'error', 'Job offer has expired');
    END IF;
    
    IF offer_record.scheduled_date IS NOT NULL THEN
        SELECT is_worker_available(
            worker_id_param,
            (offer_record.scheduled_date + offer_record.scheduled_start_time)::TIMESTAMP WITH TIME ZONE,
            (offer_record.scheduled_date + offer_record.scheduled_end_time)::TIMESTAMP WITH TIME ZONE
        ) INTO is_available;
        
        IF NOT is_available THEN
            RETURN json_build_object('success', false, 'error', 'You have a scheduling conflict');
        END IF;
    END IF;
    
    -- Accept this offer
    UPDATE job_offers SET offer_status = 'accepted', responded_at = NOW()
    WHERE id = offer_id_param;
    
    -- Reject all other pending offers for this worker with time conflicts
    UPDATE job_offers jo
    SET offer_status = 'rejected', responded_at = NOW()
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
    
    -- Update job application to hired/in_progress
    UPDATE job_applications
    SET work_status = 'in_progress',
        started_at = NOW()
    WHERE id = offer_record.job_application_id;
    
    -- Mark worker as busy until job ends
    UPDATE employees
    SET busy_until = offer_record.expected_completion_at,
        current_job_id = offer_record.posting_id
    WHERE id = worker_id_param;
    
    -- Create notifications for rejected employers
    INSERT INTO notifications (employee_id, employer_id, type, title, message, job_id)
    SELECT 
        NULL,
        jp.employer_id,
        'job_offer_rejected',
        'Worker Unavailable',
        'Worker has accepted another job at the same time',
        jp.id
    FROM job_offers jo_rejected
    JOIN job_postings jp ON jo_rejected.job_posting_id = jp.id
    WHERE jo_rejected.employee_id = worker_id_param
        AND jo_rejected.offer_status = 'rejected'
        AND jo_rejected.responded_at = NOW();
    
    RETURN json_build_object('success', true, 'message', 'Job offer accepted successfully');
END;
$$ LANGUAGE plpgsql;

-- ============ STEP 11: Reject job offer function ============
CREATE OR REPLACE FUNCTION reject_job_offer(offer_id_param UUID, worker_id_param UUID)
RETURNS JSON AS $$
DECLARE
    employer_id_val UUID;
    job_id_val UUID;
BEGIN
    -- Get employer and job info before rejecting
    SELECT jp.employer_id, jp.id INTO employer_id_val, job_id_val
    FROM job_offers jo
    JOIN job_postings jp ON jo.job_posting_id = jp.id
    WHERE jo.id = offer_id_param
        AND jo.employee_id = worker_id_param
        AND jo.offer_status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Job offer not found');
    END IF;
    
    UPDATE job_offers
    SET offer_status = 'rejected', responded_at = NOW()
    WHERE id = offer_id_param;
    
    -- Notify employer
    INSERT INTO notifications (employer_id, type, title, message, job_id)
    VALUES (
        employer_id_val,
        'job_offer_rejected',
        'Job Offer Declined',
        'Worker has declined your job offer',
        job_id_val
    );
    
    RETURN json_build_object('success', true, 'message', 'Job offer rejected');
END;
$$ LANGUAGE plpgsql;

-- ============ STEP 12: Clear busy status when job completes ============
CREATE OR REPLACE FUNCTION clear_busy_status_on_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.work_status = 'completed' AND (OLD.work_status IS NULL OR OLD.work_status != 'completed') THEN
        UPDATE employees
        SET busy_until = NULL,
            current_job_id = NULL
        WHERE id = NEW.employee_id
            AND current_job_id = NEW.job_posting_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clear_busy_status ON job_applications;
CREATE TRIGGER trigger_clear_busy_status
    AFTER UPDATE OF work_status ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION clear_busy_status_on_complete();

-- ============ COMPLETED ============
-- Run this entire file in Supabase SQL Editor
-- After running, your app will support:
-- 1. Multiple employers offering same job
-- 2. Worker choosing between offers
-- 3. Automatic rejection notifications
-- 4. Busy time tracking
-- 5. Conflict prevention
