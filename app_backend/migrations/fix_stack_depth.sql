-- Fix stack depth limit exceeded error
-- This migration fixes the infinite recursion caused by trigger_expire_job_offers
-- Run this in Supabase SQL Editor AFTER running fix_job_applications.sql

-- ============ Step 1: Drop the problematic trigger ============
DROP TRIGGER IF EXISTS trigger_expire_job_offers ON job_offers;

-- ============ Step 2: Recreate expire function WITHOUT recursive trigger ============
-- Instead of using a trigger that updates job_offers (causing recursion),
-- we'll rely on the view to check expiration status dynamically

-- Remove the old function
DROP FUNCTION IF EXISTS expire_old_job_offers();

-- ============ Step 3: Fix the create_job_offer trigger ============
DROP TRIGGER IF EXISTS trigger_create_job_offer ON job_applications;

CREATE OR REPLACE FUNCTION create_job_offer_on_accept()
RETURNS TRIGGER AS $$
DECLARE
    emp_id UUID;
    existing_offer_id UUID;
    existing_offer_status VARCHAR(20);
BEGIN
    -- Only process if status changed to 'accepted' from a different status
    IF NEW.status = 'accepted' AND (OLD IS NULL OR OLD.status != 'accepted') THEN
        
        -- Check if an offer already exists for this application
        SELECT id, offer_status INTO existing_offer_id, existing_offer_status
        FROM job_offers
        WHERE job_application_id = NEW.id
          AND employee_id = NEW.employee_id
        LIMIT 1;
        
        -- If offer exists and is already pending or accepted, skip creation
        IF existing_offer_id IS NOT NULL AND existing_offer_status IN ('pending', 'accepted') THEN
            RETURN NEW;
        END IF;
        
        -- Get employer ID
        SELECT employer_id INTO emp_id
        FROM job_postings
        WHERE id = NEW.job_posting_id;
        
        -- Create or update the job offer
        INSERT INTO job_offers (
            job_application_id,
            job_posting_id,
            employee_id,
            employer_id,
            offer_status,
            offered_at,
            expires_at
        ) VALUES (
            NEW.id,
            NEW.job_posting_id,
            NEW.employee_id,
            emp_id,
            'pending',
            NOW(),
            NOW() + INTERVAL '24 hours'
        )
        ON CONFLICT (job_application_id, employee_id) 
        DO UPDATE SET 
            offer_status = CASE 
                WHEN job_offers.offer_status = 'accepted' THEN 'accepted'
                ELSE 'pending'
            END,
            offered_at = CASE 
                WHEN job_offers.offer_status != 'accepted' THEN NOW()
                ELSE job_offers.offered_at
            END,
            expires_at = CASE 
                WHEN job_offers.offer_status != 'accepted' THEN NOW() + INTERVAL '24 hours'
                ELSE job_offers.expires_at
            END;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger - only fire on status column changes
CREATE TRIGGER trigger_create_job_offer
    AFTER UPDATE OF status ON job_applications
    FOR EACH ROW
    WHEN (NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted'))
    EXECUTE FUNCTION create_job_offer_on_accept();

-- ============ Step 4: Update worker_job_offers view to handle expiration dynamically ============
DROP VIEW IF EXISTS worker_job_offers;
CREATE VIEW worker_job_offers AS
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
    jp.location,
    jo.offer_status,
    jo.offered_at,
    jo.responded_at,
    jo.expires_at,
    -- Dynamically check if expired
    CASE 
        WHEN jo.offer_status = 'pending' AND jo.expires_at < NOW() THEN true
        ELSE false
    END as is_expired,
    e.name as employer_name,
    e.business_name as company_name,
    e.phone as employer_phone,
    e.business_type,
    -- Check if worker can accept (no conflicts)
    CASE 
        WHEN jo.offer_status = 'pending' 
            AND jo.expires_at >= NOW() 
            AND jp.scheduled_date IS NOT NULL 
            AND jp.scheduled_start_time IS NOT NULL
            AND jp.scheduled_end_time IS NOT NULL
        THEN is_worker_available(
            jo.employee_id,
            (jp.scheduled_date + jp.scheduled_start_time)::TIMESTAMP WITH TIME ZONE,
            (jp.scheduled_date + jp.scheduled_end_time)::TIMESTAMP WITH TIME ZONE
        )
        WHEN jo.offer_status = 'pending' AND jo.expires_at >= NOW()
        THEN true
        ELSE false
    END as is_available
FROM job_offers jo
JOIN job_postings jp ON jo.job_posting_id = jp.id
JOIN employers e ON jp.employer_id = e.id
WHERE jo.offer_status IN ('pending', 'accepted');

-- ============ Step 5: Create a maintenance function (optional - run manually or via cron) ============
CREATE OR REPLACE FUNCTION cleanup_expired_offers()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE job_offers
    SET offer_status = 'expired'
    WHERE offer_status = 'pending'
        AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to prevent duplicate offers in pending/accepted state
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_offer 
ON job_offers(job_application_id, employee_id) 
WHERE offer_status IN ('pending', 'accepted');

SELECT 'Stack depth fix applied successfully! Removed recursive trigger.' as result;

