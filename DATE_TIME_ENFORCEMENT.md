# Date/Time Enforcement & Employer Confirmation System

## IMPORTANT: New Features Added

### 1. Job Scheduling (Date/Time Tracking)
### 2. Completion Time Enforcement  
### 3. Mandatory Employer Confirmation Popup

---

## Migration Required

### Run this NEW migration in Supabase SQL Editor:
```
Backend/migrations/add_job_scheduling.sql
```

This adds:
- **Date fields** to job_postings (scheduled_date, scheduled_start_time, scheduled_end_time)
- **Auto-calculated** expected_completion_at field
- **Employer confirmation** pending flag
- **Database functions** to check if jobs can be completed
- **Trigger** to automatically flag employers for confirmation

---

## How Date/Time Enforcement Works

### Before:
- Workers could mark any accepted job as complete at any time ❌
- No way to enforce job timing

### Now:
- Jobs have scheduled dates and times ✅
- Workers can ONLY mark complete AFTER the job's scheduled end time ✅
- System shows countdown: "Please wait 2h 30m" if too early ✅

### Example:

**Job Details:**
- Scheduled Date: January 20, 2026
- Start Time: 9:00 AM
- End Time: 5:00 PM

**Worker Timeline:**
```
2:30 PM → Tries to mark complete → ❌ ERROR: "Job scheduled to end at 5:00 PM. Please wait 2h 30m."
5:15 PM → Tries to mark complete → ✅ SUCCESS: Job marked as completed!
```

---

## Mandatory Employer Confirmation Popup

### The Problem:
- Employers forget to confirm completed jobs
- Workers don't get paid/rated on time
- No accountability

### The Solution:
When employer opens the app, if ANY jobs are pending confirmation:
1. **Mandatory popup appears** (cannot dismiss without action)
2. Shows job details:
   - Job title
   - Worker name and rating
   - When completed (e.g., "3 days ago")
   - Worker's completion notes
   - Days pending badge (e.g., "3d")
3. Employer MUST:
   - **Rate worker (1-5 stars)** - REQUIRED
   - Write review (optional)
   - Click "Confirm & Next" or "Skip for Now"
4. Goes through ALL pending jobs one by one
5. Progress shown: "2 of 5"

### What Gets Flagged:
- All jobs where `work_status = 'completed'`
- AND `employer_confirmation_pending = TRUE`
- Sorted by oldest first

---

## API Changes

### Worker: Mark Job Complete
**Endpoint:** `PATCH /job-applications/:application_id/complete`

**New Behavior:**
- Checks if `expected_completion_at` has passed
- If too early, returns error with time remaining
- If on time, marks complete and flags employer

**Error Response (if too early):**
```json
{
  "error": "Cannot mark job as complete before scheduled end time",
  "details": "Job is scheduled to end at 1/20/2026, 5:00 PM. Please wait 2h 30m."
}
```

### Employer: Get Pending Confirmations
**New Endpoint:** `GET /job-applications/pending-confirmations`

**Response:**
```json
{
  "count": 2,
  "data": [
    {
      "application_id": "uuid",
      "job_title": "House Painting",
      "worker_name": "Ravi Kumar",
      "worker_rating": 4.5,
      "completed_at": "2026-01-20T17:30:00Z",
      "completion_notes": "Finished all 3 rooms, used premium paint",
      "days_pending": 2,
      "job_id": "uuid"
    }
  ]
}
```

### Employer: Confirm Completion
**Endpoint:** `PATCH /job-applications/:application_id/confirm-completion`

**Updated:** Now clears the `employer_confirmation_pending` flag

---

## Frontend Updates

### New Component: PendingConfirmationsModal
**Location:** `components/PendingConfirmationsModal.tsx`

Features:
- Shows one pending job at a time
- 5-star rating interface (required)
- Review text area (optional)
- Progress counter ("2 of 5")
- "Skip for Now" and "Confirm & Next" buttons
- Auto-closes when all confirmed

**Integration:**
Added to `app/(employer)/dashboard.tsx`:
- Shows automatically 1 second after dashboard loads
- Checks for pending confirmations via API
- Only shows if count > 0

### Worker My Jobs Screen Updates
- Error handling for early completion attempts
- Shows clear error message with countdown
- Prevents spam clicking

---

## How to Create Scheduled Jobs

### Frontend (Employer Post Job):
Add these fields to the job posting form:
```javascript
{
  "title": "House Painting",
  "category": "Painting",
  "description": "...",
  "wage": 800,
  "duration": "9:00 AM - 5:00 PM",  // Text description (still shown in UI)
  
  // NEW FIELDS:
  "scheduled_date": "2026-01-20",          // YYYY-MM-DD
  "scheduled_start_time": "09:00:00",      // HH:MM:SS (24-hour)
  "scheduled_end_time": "17:00:00",        // HH:MM:SS (24-hour)
  "duration_hours": 8.0                     // Number
}
```

### Backend automatically calculates:
- `expected_completion_at` = `scheduled_date + scheduled_end_time`
- Example: `2026-01-20 17:00:00+00`

---

## Backward Compatibility

### Old jobs (no scheduling):
- `expected_completion_at` = NULL
- Workers can mark complete anytime (old behavior)
- No time enforcement
- Still works normally

### New jobs (with scheduling):
- MUST wait until scheduled end time
- Enforced by database function: `can_mark_job_complete()`

---

## Database Functions Added

### 1. can_mark_job_complete(application_id)
Checks if job can be marked complete now:
```sql
SELECT can_mark_job_complete('app-uuid');
-- Returns: true if time passed OR no schedule set
--          false if before scheduled end time
```

### 2. get_employer_pending_confirmations(employer_id)
Gets all jobs awaiting confirmation:
```sql
SELECT * FROM get_employer_pending_confirmations('emp-uuid');
-- Returns: list of pending jobs with worker info
```

### 3. set_employer_confirmation_pending()
**Trigger function** that runs on UPDATE:
- When `work_status` changes to 'completed': Sets `employer_confirmation_pending = TRUE`
- When `worker_rating` is set: Sets `employer_confirmation_pending = FALSE`

---

## Views Added

### jobs_ready_for_completion
Shows all in-progress jobs with completion status:
```sql
SELECT * FROM jobs_ready_for_completion 
WHERE employee_id = 'worker-uuid';

-- Shows:
-- - application_id
-- - job details
-- - can_mark_complete (boolean)
```

---

## Testing Checklist

- [ ] Run add_job_scheduling.sql migration
- [ ] Create a job with scheduled date/time
- [ ] Worker accepts job (check work_status = 'in_progress')
- [ ] Worker tries to complete early (should see error)
- [ ] Wait or manually set time past end_time
- [ ] Worker marks complete (should succeed)
- [ ] Check employer_confirmation_pending = TRUE
- [ ] Employer opens dashboard (should see popup)
- [ ] Employer confirms with rating
- [ ] Check employer_confirmation_pending = FALSE
- [ ] Verify worker's rating updated

---

## Common Issues

### Issue: "Job can be completed anytime"
**Cause:** Job doesn't have scheduled_date or expected_completion_at
**Fix:** Update job with scheduling fields or accept old behavior

### Issue: "Popup doesn't show for employer"
**Check:**
```sql
SELECT * FROM job_applications 
WHERE work_status = 'completed' 
AND employer_confirmation_pending = TRUE;
```
If empty, no jobs pending

### Issue: "Can't mark complete even after time passed"
**Debug:**
```sql
SELECT 
  expected_completion_at,
  NOW() as current_time,
  can_mark_job_complete(id) as can_complete
FROM job_applications 
WHERE id = 'app-uuid';
```

---

## Next Steps

1. **Run the migration** - add_job_scheduling.sql
2. **Test the flow** - Create scheduled job, try to complete early
3. **Update job posting form** - Add date/time pickers
4. **Train users** - Employers must set job times
5. **Monitor** - Check pending_confirmations daily

---

## Benefits

✅ Workers can't cheat by marking jobs done early
✅ Employers forced to rate workers (builds trust)
✅ Clear expectations for job timing
✅ Better analytics (know exact work hours)
✅ Prevents payment disputes
✅ Automated reminders for employers
