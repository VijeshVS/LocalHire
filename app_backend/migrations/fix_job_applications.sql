-- Fix missing work_status column and related fields in job_applications
-- Run this in Supabase SQL Editor to fix the "failed to update status" error

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS work_status VARCHAR(20) DEFAULT 'pending' CHECK (work_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS employer_rating INTEGER CHECK (employer_rating >= 1 AND employer_rating <= 5),
ADD COLUMN IF NOT EXISTS employer_review TEXT,
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Update existing records to have work_status
UPDATE job_applications
SET work_status = CASE
    WHEN status = 'accepted' THEN 'pending'
    ELSE 'pending'
END
WHERE work_status IS NULL;

-- Create index for work_status queries
CREATE INDEX IF NOT EXISTS idx_job_applications_work_status ON job_applications(work_status);

SELECT 'Migration completed successfully! The work_status column has been added.' as result;
