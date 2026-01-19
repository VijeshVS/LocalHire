-- ============================================================================
-- Fix: Remove automatic work_status update trigger
-- ============================================================================
-- Previously, when employer accepted an application, work_status was automatically
-- set to 'in_progress'. Now with the job offer system:
-- 1. Employer accepts → creates a pending offer
-- 2. Worker accepts offer → work_status becomes 'in_progress'
-- ============================================================================

-- Drop the trigger that automatically sets work_status to in_progress
DROP TRIGGER IF EXISTS trigger_set_work_started ON job_applications;

-- Drop the function as well since it's no longer needed
DROP FUNCTION IF EXISTS set_work_started_timestamp();

-- Also reset any jobs that have work_status='in_progress' but don't have an accepted offer
-- (These are jobs where employer accepted but worker hasn't accepted the offer yet)
UPDATE job_applications ja
SET work_status = 'pending'
WHERE ja.status = 'accepted' 
  AND ja.work_status = 'in_progress'
  AND NOT EXISTS (
    SELECT 1 FROM job_offers jo
    WHERE jo.job_application_id = ja.id
      AND jo.offer_status = 'accepted'
  );

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Trigger trigger_set_work_started has been removed.';
    RAISE NOTICE 'work_status will only be set to in_progress when worker accepts an offer.';
END $$;
