# 🚀 Complete Job Workflow Setup Guide

## Problem Statement
You requested the following features:
1. ✅ Fix `worker_job_offers` table error
2. ✅ Prevent duplicate job applications
3. ✅ Show all applications (applied, accepted, rejected) in "My Jobs"
4. ✅ Allow worker to choose between multiple job offers
5. ✅ Automatic rejection notifications for other employers
6. ✅ Mark worker as "busy" during hired time
7. ✅ Show "Hired" status only after worker accepts

## 🔧 Implementation Steps

### Step 1: Run Database Migration

**IMPORTANT: This MUST be done first!**

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the ENTIRE content of `Backend/migrations/complete_job_workflow.sql`
4. Paste it in the SQL Editor
5. Click **Run**

This will create:
- ✅ `job_offers` table
- ✅ `worker_job_offers` view (fixes your error!)
- ✅ `busy_until` and `current_job_id` columns in employees table
- ✅ Scheduling columns in job_postings table
- ✅ All necessary triggers and functions

### Step 2: Verify Migration Success

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if view exists
SELECT * FROM worker_job_offers LIMIT 1;

-- Check if new columns exist
SELECT busy_until, current_job_id FROM employees LIMIT 1;

-- Check if job_offers table exists
SELECT * FROM job_offers LIMIT 1;
```

If no errors, you're good to go! ✅

## 📱 How It Works Now

### For Workers:

#### 1. **Applying for Jobs**
- Worker browses jobs and clicks "Apply"
- System checks if they already applied
- If already applied, shows: "Already Applied - Status: {status}"
- Redirects to "My Jobs" to see all applications

#### 2. **My Jobs Screen** (Updated!)
- **Applied Tab**: Shows all pending applications (status: applied/pending)
  - See which jobs you've applied to
  - Shows rejected applications too
  
- **Hired Tab**: Shows accepted jobs you're working on
  - Only jobs where employer accepted AND worker accepted offer
  - Shows "Mark as Completed" button
  
- **Completed Tab**: Shows finished jobs
  - Waiting for employer confirmation

#### 3. **Job Offers Screen** (NEW FLOW!)
When multiple employers accept your application:

**Scenario**: You applied to 3 painting jobs at same time slot
- Employer A accepts → You get offer notification
- Employer B accepts → You get offer notification  
- Employer C accepts → You get offer notification

**Now you see 3 pending offers in Job Offers screen**

**What happens when you accept one?**
1. ✅ You accept Employer A's offer
2. ✅ Job shows in "Hired" tab
3. ✅ You are marked as BUSY until job ends
4. ✅ Employers B & C get notification: "Worker accepted another job"
5. ✅ Their offers automatically rejected

**During Busy Time:**
- ❌ No one can hire you for conflicting times
- ✅ Employers can still hire you for AFTER your busy time
- ✅ Your profile shows "Busy until: {date/time}"

#### 4. **Completing Jobs**
- Click "Mark as Completed" in Hired tab
- Rate employer (optional)
- Write review (optional)
- Submit → Job moves to Completed tab
- ✅ Your busy status is CLEARED
- ✅ You're available for new jobs

### For Employers:

#### 1. **Hiring Workers**
- See applications for your jobs
- Click "Accept" on a worker
- System creates job offer for worker
- Worker has 24 hours to accept/reject

#### 2. **What happens if worker rejects?**
- You get notification: "Worker declined your offer"
- Application stays as "accepted" on your side
- You can offer to other workers

#### 3. **What happens if worker is busy?**
- If worker has conflicting job, offer shows "CONFLICT"
- Worker cannot accept your offer until conflict resolved
- You see worker's availability status

## 🎯 Key Features Implemented

### ✅ Duplicate Prevention
```typescript
// In job details screen
if (hasApplied) {
  Alert.alert('Already Applied', 'You have already applied for this job');
  return;
}
```

### ✅ All Applications Visible
```typescript
// My Jobs now has 3 tabs:
- Applied: See pending/rejected applications
- Hired: See accepted jobs you're working on  
- Completed: See finished jobs
```

### ✅ Job Offer System
```sql
-- When employer accepts
CREATE TRIGGER trigger_create_job_offer
  AFTER UPDATE OF status ON job_applications
  EXECUTE FUNCTION create_job_offer_on_accept();

-- When worker accepts offer
CREATE FUNCTION accept_job_offer(offer_id, worker_id)
  -- Sets busy_until timestamp
  -- Rejects conflicting offers
  -- Notifies rejected employers
```

### ✅ Busy Time Tracking
```sql
-- Worker profile includes:
busy_until TIMESTAMP -- When worker becomes available
current_job_id UUID   -- Which job they're doing
is_busy BOOLEAN       -- Computed field

-- Automatically cleared when job completed
CREATE TRIGGER trigger_clear_busy_status
  AFTER UPDATE OF work_status ON job_applications
  EXECUTE FUNCTION clear_busy_status_on_complete();
```

### ✅ Conflict Prevention
```sql
-- Checks if worker available for time slot
CREATE FUNCTION is_worker_available(
  worker_id UUID,
  start_time TIMESTAMP,
  end_time TIMESTAMP
) RETURNS BOOLEAN
-- Returns false if worker busy or has conflicting job
```

### ✅ Automatic Notifications
```sql
-- When worker accepts offer, rejected employers get:
INSERT INTO notifications (
  employer_id,
  type: 'job_offer_rejected',
  title: 'Worker Unavailable',
  message: 'Worker has accepted another job at the same time'
)
```

## 🧪 Testing the Flow

### Test Scenario 1: Duplicate Application Prevention

1. Login as worker (ravi@example.com / password123)
2. Find any job and click "Apply"
3. Success! Application sent
4. Go back to same job
5. Click "Apply" again
6. ❌ See "Already Applied" alert
7. ✅ Redirected to My Jobs

### Test Scenario 2: Multiple Job Offers

**Setup:**
1. Login as worker (ravi@example.com)
2. Apply to 3 painting jobs (same date/time if possible)
3. Logout

**As Employer 1:**
1. Login (rajesh@example.com / password123)
2. Go to Candidates
3. Accept Ravi's application
4. Logout

**As Employer 2:**
1. Login (priya@example.com / password123)  
2. Go to Candidates
3. Accept Ravi's application
4. Logout

**As Employer 3:**
1. Login (amit@example.com / password123)
2. Go to Candidates  
3. Accept Ravi's application
4. Logout

**As Worker (Ravi):**
1. Login again
2. Go to "Job Offers" (alerts tab)
3. See 3 pending offers!
4. Accept one offer
5. ✅ See "Job offer accepted!"
6. Check "My Jobs" → "Hired" tab → Job is there
7. Go back to "Job Offers" 
8. ✅ Other 2 offers disappeared (auto-rejected)

**As Employers 2 & 3:**
1. Login
2. Check notifications
3. ✅ See "Worker accepted another job" notification

### Test Scenario 3: Busy Time Enforcement

1. As worker, accept a job for tomorrow 9 AM - 5 PM
2. Check your profile → Should show "Busy until: tomorrow 5 PM"
3. As employer, try to hire same worker for tomorrow 2 PM - 4 PM
4. ❌ System should show conflict warning
5. Try to hire for tomorrow 6 PM - 8 PM
6. ✅ Should work! (after busy time)

### Test Scenario 4: Job Completion

1. As worker in "Hired" tab
2. Click "Mark as Completed"
3. Rate employer (optional)
4. Submit
5. ✅ Job moves to "Completed" tab
6. ✅ Your busy status cleared
7. ✅ Available for new jobs immediately

## 📊 Database Schema Changes

### New Columns in `employees`:
```sql
busy_until TIMESTAMP WITH TIME ZONE  -- When worker becomes free
current_job_id UUID                 -- Which job they're doing
```

### New Columns in `job_postings`:
```sql
scheduled_date DATE                      -- Job date
scheduled_start_time TIME                -- Start time
scheduled_end_time TIME                  -- End time  
expected_completion_at TIMESTAMP         -- Auto-calculated
```

### New Columns in `job_applications`:
```sql
started_at TIMESTAMP                     -- When job started
employer_confirmation_pending BOOLEAN    -- Needs employer OK
```

### New Table `job_offers`:
```sql
id UUID PRIMARY KEY
job_application_id UUID REFERENCES job_applications
employee_id UUID REFERENCES employees
employer_id UUID
offer_status VARCHAR(20)  -- pending/accepted/rejected/expired
offered_at TIMESTAMP
responded_at TIMESTAMP
expires_at TIMESTAMP      -- 24 hours to respond
```

### New View `worker_job_offers`:
```sql
-- Shows all pending offers with availability check
SELECT 
  offer details,
  is_worker_available() as is_available
FROM job_offers
WHERE offer_status = 'pending'
```

## 🔍 Troubleshooting

### Error: "Could not find the table 'public.worker_job_offers'"
**Solution**: You didn't run the migration! Go back to Step 1.

### Error: "Column busy_until does not exist"
**Solution**: Migration didn't complete. Run it again.

### Offers not appearing in Job Offers screen
**Check:**
1. Did employer accept your application?
2. Is offer expired? (>24 hours old)
3. Check Supabase: `SELECT * FROM job_offers WHERE employee_id = 'your-id'`

### Worker not marked as busy after accepting
**Check:**
1. Does job have scheduled_date and scheduled_end_time?
2. Run: `SELECT busy_until FROM employees WHERE id = 'your-id'`
3. Check trigger is working: Look in Supabase logs

### Conflicting offers not auto-rejecting
**Check:**
1. Do jobs have same date/time?
2. Run SQL: `SELECT * FROM job_offers WHERE employee_id = 'your-id'`
3. Should see offer_status = 'rejected' for conflicts

## 📝 API Endpoints

### Worker Endpoints:
```
GET    /api/job-applications/my-applications   - Get all my applications
POST   /api/job-applications/apply             - Apply for job (checks duplicates)
GET    /api/job-offers/my-offers               - Get pending job offers
POST   /api/job-offers/:offer_id/accept        - Accept job offer
POST   /api/job-offers/:offer_id/reject        - Reject job offer
GET    /api/employee/profile                   - Get profile (includes busy status)
```

### Employer Endpoints:
```
GET    /api/employer-applications/job/:job_id  - See applications
PUT    /api/employer-applications/:id/accept   - Accept worker (creates offer)
GET    /api/notifications/employer             - See rejection notifications
```

## 🎉 Success Indicators

You've implemented everything correctly if:

✅ Workers can't apply to same job twice
✅ "My Jobs" shows 3 tabs: Applied, Hired, Completed  
✅ Multiple employers can accept same worker
✅ Worker sees all offers in "Job Offers" screen
✅ Accepting one offer rejects others automatically
✅ Rejected employers get notifications
✅ Worker marked as busy during job
✅ No one can hire busy worker for conflicting times
✅ Busy status cleared when job completed
✅ Jobs only show as "Hired" after worker accepts

## 🆘 Need Help?

If something's not working:

1. Check Supabase SQL Editor logs
2. Check your backend terminal logs
3. Check frontend console logs in Expo
4. Run test queries in Supabase:

```sql
-- Check job offers
SELECT * FROM job_offers WHERE employee_id = 'worker-id';

-- Check busy status
SELECT id, name, busy_until, current_job_id FROM employees WHERE id = 'worker-id';

-- Check view works
SELECT * FROM worker_job_offers WHERE employee_id = 'worker-id';

-- Check triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%job%';
```

## 📞 Test Credentials

**Workers:**
- ravi@example.com / password123
- sunita@example.com / password123  
- suresh@example.com / password123

**Employers:**
- rajesh@example.com / password123
- priya@example.com / password123
- amit@example.com / password123

---

**Happy Hiring! 🎊**
