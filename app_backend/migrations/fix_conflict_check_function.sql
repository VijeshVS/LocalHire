-- ============================================================================
-- Fix: Update can_accept_job_without_conflict to only check in_progress jobs
-- ============================================================================
-- The function was checking all non-completed jobs, but it should only check
-- jobs where work_status = 'in_progress' (worker has accepted the offer).
-- Jobs with work_status = 'pending' should NOT block accepting new offers.
-- ============================================================================

-- Update the conflict check function
CREATE OR REPLACE FUNCTION can_accept_job_without_conflict(
    worker_id UUID,
    new_job_id UUID
) RETURNS TABLE (
    can_accept BOOLEAN,
    conflict_reason TEXT,
    conflicting_jobs UUID[]
) AS $$
DECLARE
    new_date DATE;
    new_start TIME;
    new_end TIME;
    conflicting_job_ids UUID[];
BEGIN
    -- Get the schedule details of the new job
    SELECT scheduled_date, scheduled_start_time, scheduled_end_time
    INTO new_date, new_start, new_end
    FROM job_postings
    WHERE id = new_job_id;
    
    -- If no schedule info, allow acceptance
    IF new_date IS NULL OR new_start IS NULL OR new_end IS NULL THEN
        RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::UUID[];
        RETURN;
    END IF;
    
    -- Check for existing ACCEPTED jobs (work_status = 'in_progress') with overlapping time
    -- IMPORTANT: Only check jobs where worker has ACTUALLY accepted the offer
    -- (work_status = 'in_progress'), not jobs just pending employer acceptance
    SELECT ARRAY_AGG(ja.id)
    INTO conflicting_job_ids
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_posting_id = jp.id
    WHERE ja.employee_id = worker_id
        AND ja.status = 'accepted'
        AND ja.work_status = 'in_progress'  -- ONLY check in_progress jobs
        AND ja.job_posting_id != new_job_id  -- Don't conflict with self
        AND jp.scheduled_date = new_date     -- Same date
        AND jp.scheduled_start_time < new_end  -- Time overlap check
        AND jp.scheduled_end_time > new_start;
    
    -- If conflicts exist, return false
    IF conflicting_job_ids IS NOT NULL AND array_length(conflicting_job_ids, 1) > 0 THEN
        RETURN QUERY SELECT 
            FALSE, 
            'You have already accepted a job at this time slot. Please complete or cancel it first.',
            conflicting_job_ids;
    ELSE
        RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::UUID[];
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Also update the is_worker_available function to be consistent
CREATE OR REPLACE FUNCTION is_worker_available(
    worker_id UUID,
    check_start TIMESTAMP WITH TIME ZONE,
    check_end TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INT;
BEGIN
    -- Check for overlapping jobs where worker has accepted (work_status = 'in_progress')
    SELECT COUNT(*)
    INTO conflict_count
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_posting_id = jp.id
    WHERE ja.employee_id = worker_id
        AND ja.status = 'accepted'
        AND ja.work_status = 'in_progress'  -- ONLY check in_progress jobs
        AND jp.scheduled_date = check_start::DATE
        AND (jp.scheduled_date + jp.scheduled_start_time)::TIMESTAMP WITH TIME ZONE < check_end
        AND (jp.scheduled_date + jp.scheduled_end_time)::TIMESTAMP WITH TIME ZONE > check_start;
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Updated can_accept_job_without_conflict to only check work_status = in_progress';
    RAISE NOTICE 'Updated is_worker_available to only check work_status = in_progress';
END $$;
