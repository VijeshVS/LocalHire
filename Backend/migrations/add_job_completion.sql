-- =============================================
-- Job Completion Tracking
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add completion tracking fields to job_applications table
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS work_status VARCHAR(20) DEFAULT 'pending' 
CHECK (work_status IN ('pending', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Add rating fields for both parties
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS employer_rating INTEGER CHECK (employer_rating >= 1 AND employer_rating <= 5);

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS worker_rating INTEGER CHECK (worker_rating >= 1 AND worker_rating <= 5);

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS employer_review TEXT;

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS worker_review TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_work_status ON job_applications(work_status);
CREATE INDEX IF NOT EXISTS idx_job_applications_completed ON job_applications(completed_at) WHERE completed_at IS NOT NULL;

-- Optional: Add a trigger to automatically set started_at when status changes to 'accepted'
CREATE OR REPLACE FUNCTION set_work_started_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to 'accepted' and work_status is still 'pending', set to 'in_progress'
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' AND NEW.work_status = 'pending' THEN
        NEW.work_status := 'in_progress';
        NEW.started_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_work_started ON job_applications;

CREATE TRIGGER trigger_set_work_started
BEFORE UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION set_work_started_timestamp();
