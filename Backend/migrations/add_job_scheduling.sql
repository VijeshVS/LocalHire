-- =============================================
-- Job Scheduling & Date Tracking
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add scheduling fields to job_postings table
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS scheduled_start_time TIME;

ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;

ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4,2);

-- Add regular column for expected completion datetime (will be set by trigger)
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS expected_completion_at TIMESTAMP WITH TIME ZONE;

-- Create trigger function to auto-calculate expected_completion_at
CREATE OR REPLACE FUNCTION calculate_expected_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate expected completion time from date + end time
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_end_time IS NOT NULL THEN
        NEW.expected_completion_at := (NEW.scheduled_date + NEW.scheduled_end_time)::TIMESTAMP WITH TIME ZONE;
    ELSE
        NEW.expected_completion_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update expected_completion_at
DROP TRIGGER IF EXISTS trigger_calculate_expected_completion ON job_postings;
CREATE TRIGGER trigger_calculate_expected_completion
    BEFORE INSERT OR UPDATE OF scheduled_date, scheduled_end_time ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_expected_completion();

-- Create indexes for date queries
CREATE INDEX IF NOT EXISTS idx_job_postings_scheduled_date ON job_postings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_job_postings_expected_completion ON job_postings(expected_completion_at) WHERE expected_completion_at IS NOT NULL;

-- Add field to track if employer needs to confirm completion
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS employer_confirmation_pending BOOLEAN DEFAULT FALSE;

-- Create function to check if job can be marked complete
CREATE OR REPLACE FUNCTION can_mark_job_complete(application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_completion_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get the expected completion time for this job
    SELECT jp.expected_completion_at
    INTO job_completion_time
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_posting_id = jp.id
    WHERE ja.id = application_id;
    
    -- If no scheduled time, allow completion (backward compatibility)
    IF job_completion_time IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Only allow completion after the scheduled end time
    RETURN current_time >= job_completion_time;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pending confirmations for employer
CREATE OR REPLACE FUNCTION get_employer_pending_confirmations(emp_id UUID)
RETURNS TABLE (
    application_id UUID,
    job_title TEXT,
    worker_name TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    days_pending INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ja.id as application_id,
        jp.title as job_title,
        e.name as worker_name,
        ja.completed_at,
        EXTRACT(DAY FROM (NOW() - ja.completed_at))::INTEGER as days_pending
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_posting_id = jp.id
    JOIN employees e ON ja.employee_id = e.id
    WHERE jp.employer_id = emp_id
        AND ja.work_status = 'completed'
        AND ja.employer_confirmation_pending = TRUE
        AND ja.completed_at IS NOT NULL
    ORDER BY ja.completed_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to set employer_confirmation_pending when worker marks complete
CREATE OR REPLACE FUNCTION set_employer_confirmation_pending()
RETURNS TRIGGER AS $$
BEGIN
    -- When worker marks job as completed, flag it for employer confirmation
    IF NEW.work_status = 'completed' AND OLD.work_status != 'completed' THEN
        NEW.employer_confirmation_pending := TRUE;
        NEW.completed_at := NOW();
    END IF;
    
    -- When employer confirms, clear the pending flag
    IF NEW.worker_rating IS NOT NULL AND OLD.worker_rating IS NULL THEN
        NEW.employer_confirmation_pending := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_employer_confirmation_pending ON job_applications;
CREATE TRIGGER trigger_employer_confirmation_pending
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION set_employer_confirmation_pending();

-- Create view for jobs ready for completion
CREATE OR REPLACE VIEW jobs_ready_for_completion AS
SELECT 
    ja.id as application_id,
    ja.employee_id,
    ja.job_posting_id,
    jp.title as job_title,
    jp.scheduled_date,
    jp.expected_completion_at,
    ja.work_status,
    ja.started_at,
    CASE 
        WHEN jp.expected_completion_at IS NULL THEN TRUE
        WHEN NOW() >= jp.expected_completion_at THEN TRUE
        ELSE FALSE
    END as can_mark_complete
FROM job_applications ja
JOIN job_postings jp ON ja.job_posting_id = jp.id
WHERE ja.work_status = 'in_progress'
    AND ja.status = 'accepted';

COMMENT ON VIEW jobs_ready_for_completion IS 'Shows jobs that are in progress and can be marked as complete';
