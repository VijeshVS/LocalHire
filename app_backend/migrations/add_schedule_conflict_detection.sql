-- =============================================
-- Schedule Conflict Detection for Workers
-- Run this in your Supabase SQL Editor
-- =============================================

-- Function to check if two time ranges overlap on the same day
CREATE OR REPLACE FUNCTION check_time_overlap(
    date1 DATE,
    start1 TIME,
    end1 TIME,
    date2 DATE,
    start2 TIME,
    end2 TIME
) RETURNS BOOLEAN AS $$
BEGIN
    -- If different dates, no conflict
    IF date1 != date2 THEN
        RETURN FALSE;
    END IF;
    
    -- If same date, check time overlap
    -- Overlap occurs if: start1 < end2 AND end1 > start2
    RETURN (start1 < end2 AND end1 > start2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get all conflicting applications for a worker
CREATE OR REPLACE FUNCTION get_worker_schedule_conflicts(worker_id UUID)
RETURNS TABLE (
    application_id UUID,
    job_posting_id UUID,
    job_title TEXT,
    status TEXT,
    work_status TEXT,
    scheduled_date DATE,
    scheduled_start_time TIME,
    scheduled_end_time TIME,
    conflicting_application_ids UUID[],
    has_conflicts BOOLEAN,
    can_confirm BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH worker_jobs AS (
        SELECT 
            ja.id as app_id,
            ja.job_posting_id as job_id,
            jp.title,
            ja.status,
            ja.work_status,
            jp.scheduled_date,
            jp.scheduled_start_time,
            jp.scheduled_end_time
        FROM job_applications ja
        JOIN job_postings jp ON ja.job_posting_id = jp.id
        WHERE ja.employee_id = worker_id
            AND ja.status IN ('applied', 'pending', 'accepted')
            AND jp.scheduled_date IS NOT NULL
            AND jp.scheduled_start_time IS NOT NULL
            AND jp.scheduled_end_time IS NOT NULL
    ),
    conflicts AS (
        SELECT 
            w1.app_id,
            ARRAY_AGG(DISTINCT w2.app_id) as conflicting_ids,
            COUNT(DISTINCT w2.app_id) > 0 as has_conflict
        FROM worker_jobs w1
        LEFT JOIN worker_jobs w2 ON 
            w1.app_id != w2.app_id
            AND check_time_overlap(
                w1.scheduled_date, w1.scheduled_start_time, w1.scheduled_end_time,
                w2.scheduled_date, w2.scheduled_start_time, w2.scheduled_end_time
            )
        GROUP BY w1.app_id
    )
    SELECT 
        w.app_id,
        w.job_id,
        w.title,
        w.status,
        w.work_status,
        w.scheduled_date,
        w.scheduled_start_time,
        w.scheduled_end_time,
        c.conflicting_ids,
        c.has_conflict,
        -- Can confirm only if no conflicts OR this is the only accepted one in the conflict group
        CASE 
            WHEN NOT c.has_conflict THEN TRUE
            WHEN w.status = 'accepted' THEN TRUE
            ELSE FALSE
        END as can_confirm
    FROM worker_jobs w
    LEFT JOIN conflicts c ON w.app_id = c.app_id
    ORDER BY w.scheduled_date, w.scheduled_start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to validate if a worker can accept a specific job offer without conflicts
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
    
    -- Check for existing accepted jobs with same time slot
    SELECT ARRAY_AGG(ja.id)
    INTO conflicting_job_ids
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_posting_id = jp.id
    WHERE ja.employee_id = worker_id
        AND ja.status = 'accepted'
        AND ja.work_status != 'completed'
        AND check_time_overlap(
            new_date, new_start, new_end,
            jp.scheduled_date, jp.scheduled_start_time, jp.scheduled_end_time
        );
    
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

-- Add index for better performance on schedule queries
CREATE INDEX IF NOT EXISTS idx_job_postings_schedule ON job_postings(scheduled_date, scheduled_start_time, scheduled_end_time);
CREATE INDEX IF NOT EXISTS idx_job_applications_employee_status ON job_applications(employee_id, status) WHERE status IN ('applied', 'pending', 'accepted');

COMMENT ON FUNCTION check_time_overlap IS 'Checks if two date-time ranges overlap';
COMMENT ON FUNCTION get_worker_schedule_conflicts IS 'Returns all jobs for a worker with conflict information';
COMMENT ON FUNCTION can_accept_job_without_conflict IS 'Validates if a worker can accept a job without schedule conflicts';
