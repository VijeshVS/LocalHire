# Job Scheduling & Completion Workflow Guide

## 🎉 Implementation Complete!

This guide explains the complete job scheduling and completion workflow that has been implemented in LocalHire.

---

## ✅ What's Been Implemented

### 1. **Database Schema** (Already Migrated ✓)
The following database changes have been successfully applied:

- **job_postings table**: Added scheduling columns
  - `scheduled_date` (DATE): When the job needs to be done
  - `scheduled_start_time` (TIME): Start time of the job
  - `scheduled_end_time` (TIME): End time of the job
  - `expected_completion_at` (TIMESTAMP): Auto-calculated completion time

- **employees table**: Added busy tracking
  - `busy_until` (TIMESTAMP): When worker becomes available again
  - `current_job_id` (UUID): ID of currently active job

- **job_offers table**: Complete offer management
  - Tracks offer status: pending, accepted, rejected, expired
  - Auto-expires after 24 hours
  - Links employers and workers

- **SQL Functions**:
  - `is_worker_available()`: Checks if worker has schedule conflicts
  - `accept_job_offer()`: Handles offer acceptance, marks busy, rejects conflicts
  - `reject_job_offer()`: Handles offer rejection, notifies employer
  - Auto-triggers for status updates and notifications

### 2. **Employer Side: Post Job with Scheduling** ✅
**File**: `frontend/app/(employer)/post-job.tsx`

**What was added:**
- Extended form to **5 steps** (was 4 steps)
- **Step 5: Schedule the Job**
  - Date input (YYYY-MM-DD format)
  - Start time input (HH:MM 24-hour format)
  - End time input (HH:MM 24-hour format)
  - Help text guiding the format
  - Schedule preview showing entered date/time with calendar icon

**How it works:**
1. Employer fills steps 1-4 (title, description, payment, location)
2. On Step 5, they specify:
   - Date: e.g., "2026-01-20"
   - Start time: e.g., "09:00" (9 AM)
   - End time: e.g., "17:00" (5 PM)
3. Schedule preview appears showing: "📅 January 20, 2026 • 09:00 - 17:00"
4. Form validates all three fields are filled
5. On submit, sends to backend: `scheduled_date`, `scheduled_start_time`, `scheduled_end_time`

### 3. **Worker Side: Completion Popup** ✅
**Files**: 
- `frontend/components/JobCompletionModal.tsx` (New)
- `frontend/app/(worker)/home.tsx` (Updated)

**What was added:**
- **JobCompletionModal component**: Beautiful modal that appears when job time is over
- **Auto-check on home screen**: Every time worker opens the app, checks for jobs past their end time
- **Forced completion**: Modal can be dismissed with "Later" but keeps appearing until worker marks complete

**Modal Features:**
- 🎯 Shows job title and employer name
- 📝 Optional completion notes field
- ⭐ Star rating for employer (1-5 stars)
- 💬 Optional review text for employer
- ✅ "Mark Complete" button
- ⏰ "Later" button to dismiss temporarily

**How it works:**
1. When worker opens app, `checkForCompletedJobs()` runs
2. Finds jobs with `status='accepted'`, `work_status='in_progress'`
3. Checks if current time > scheduled end time
4. If yes, shows completion modal immediately
5. Worker can't fully dismiss until they mark it complete
6. After completion:
   - Job marked as completed
   - Worker's `busy_until` cleared
   - Employer rating saved
   - Worker becomes available for new jobs

---

## 🔄 Complete Workflow

### Step 1: Employer Posts Job
1. Login as employer (e.g., rajesh@example.com)
2. Navigate to "Post Job"
3. Fill Steps 1-4 (title, description, payment, location)
4. **Step 5: Schedule**
   - Date: `2026-01-25`
   - Start: `09:00`
   - End: `17:00`
5. Submit job

**Backend Action:**
- Job saved with scheduling info
- Trigger calculates `expected_completion_at` = `2026-01-25 17:00:00`

---

### Step 2: Worker Sees & Applies
1. Worker browses jobs
2. Sees job with date/time information
3. Applies to job

---

### Step 3: Employer Sends Offer
1. Employer reviews applications
2. Sends job offer to selected worker
3. Offer expires in 24 hours if not accepted

---

### Step 4: Worker Accepts Offer
1. Worker goes to "Job Offers" screen
2. Sees pending offer with scheduled date/time
3. Taps "Accept"

**Backend Action (Automatic via `accept_job_offer()` function):**
- Worker's `busy_until` set to `2026-01-25 17:00:00`
- Worker's `current_job_id` set to job ID
- Job status changed to "in_progress"
- **All other offers for same time slot auto-rejected**
- Notifications sent to rejected employers: "Worker is no longer available for this time"

---

### Step 5: Worker Works the Job
- Worker is marked "busy" during: Jan 25, 9 AM - 5 PM
- Cannot accept conflicting job offers
- Other employers see worker is unavailable for that time

---

### Step 6: Job Time Ends (Auto-Detection)
**Current time becomes: Jan 25, 5:01 PM (after 5:00 PM end time)**

1. Worker opens the app
2. `checkForCompletedJobs()` runs automatically
3. Detects: Current time (5:01 PM) > End time (5:00 PM)
4. **Completion modal appears immediately**

---

### Step 7: Worker Marks Complete
1. Modal shows: "Job Complete! Time to Mark Complete!"
2. Worker can:
   - Add completion notes (optional)
   - Rate employer 1-5 stars (optional)
   - Write review (optional)
3. Taps "Mark Complete"

**Backend Action:**
- Job `work_status` → `'completed'`
- Worker's `busy_until` → `NULL` (now available)
- Worker's `current_job_id` → `NULL`
- Employer rating saved
- Worker can now accept new jobs!

---

## 🧪 Testing the Workflow

### Test 1: Employer Post with Scheduling
```bash
# Login as employer
Email: rajesh@example.com

# Post a job with:
Date: 2026-01-20
Start: 09:00
End: 17:00

# Check database:
SELECT scheduled_date, scheduled_start_time, scheduled_end_time, expected_completion_at 
FROM job_postings 
WHERE id = '<job_id>';
```

### Test 2: Worker Acceptance Sets Busy Status
```bash
# Worker accepts offer

# Check database:
SELECT busy_until, current_job_id 
FROM employees 
WHERE id = '<worker_id>';

# Should show:
# busy_until: 2026-01-20 17:00:00
# current_job_id: <job_id>
```

### Test 3: Conflicting Offers Auto-Rejected
```bash
# Employer A: Job on Jan 20, 9AM-5PM (Worker accepts)
# Employer B: Job on Jan 20, 2PM-6PM (Overlaps!)

# Check job_offers table:
SELECT * FROM job_offers WHERE employee_id = '<worker_id>';

# Employer B's offer should be auto-rejected with reason:
# "Offer rejected: Worker accepted another job during this time period"
```

### Test 4: Completion Popup Appears
```bash
# For testing, manually update database to set end time to past:
UPDATE job_postings 
SET scheduled_date = CURRENT_DATE,
    scheduled_end_time = CURRENT_TIME - INTERVAL '1 hour'
WHERE id = '<job_id>';

# Update worker's busy_until:
UPDATE employees
SET busy_until = NOW() - INTERVAL '1 hour'
WHERE id = '<worker_id>';

# Worker opens app → Completion modal appears!
```

### Test 5: Complete Job Clears Busy Status
```bash
# Worker marks complete via modal

# Check database:
SELECT busy_until, current_job_id, work_status 
FROM employees e
JOIN job_applications ja ON ja.employee_id = e.id
WHERE e.id = '<worker_id>' AND ja.job_id = '<job_id>';

# Should show:
# busy_until: NULL
# current_job_id: NULL
# work_status: 'completed'
```

---

## 📱 User Interface Changes

### Employer: Post Job Screen
**Before:** 4-step form  
**After:** 5-step form with scheduling

**Step 5 Fields:**
```
📅 Date
[YYYY-MM-DD (e.g., 2026-01-20)]
Help: Enter date in YYYY-MM-DD format

🕐 Start Time
[HH:MM (e.g., 09:00)]
Help: 24-hour format (e.g., 09:00 for 9 AM)

🕔 End Time
[HH:MM (e.g., 17:00)]
Help: 24-hour format (e.g., 17:00 for 5 PM)

📋 Schedule Preview
┌─────────────────────────────┐
│ 📅 January 20, 2026         │
│ 🕐 09:00 - 17:00           │
└─────────────────────────────┘
```

### Worker: Home Screen
**New Feature:** Completion modal auto-appears

**Modal Content:**
```
╔══════════════════════════════════╗
║ Job Complete!                    ║
║ House Cleaning Service           ║
╠══════════════════════════════════╣
║                                  ║
║ ✅ Time to Mark Complete!       ║
║ Your scheduled work time has     ║
║ ended. Please confirm completion ║
║ and rate your employer.          ║
║                                  ║
║ Completion Notes (Optional)      ║
║ [Text area]                      ║
║                                  ║
║ Rate Employer (Optional)         ║
║ ⭐⭐⭐⭐⭐                      ║
║                                  ║
║ Review (Optional)                ║
║ [Text area]                      ║
║                                  ║
║ [Later]     [✓ Mark Complete]   ║
╚══════════════════════════════════╝
```

---

## 🗂️ Files Modified

### New Files Created
- ✅ `frontend/components/JobCompletionModal.tsx` (265 lines)

### Files Updated
- ✅ `frontend/app/(employer)/post-job.tsx` (+150 lines)
  - Added Step 5 with date/time inputs
  - Schedule preview component
  - Form validation for scheduling fields
  
- ✅ `frontend/app/(worker)/home.tsx` (+50 lines)
  - Import JobCompletionModal
  - `checkForCompletedJobs()` function
  - Auto-check on mount
  - Modal integration

### Database Files (Already Run)
- ✅ `Backend/migrations/complete_job_workflow.sql` (365 lines)
  - All schema changes applied
  - All functions and triggers active

---

## 🚀 Next Steps

### Optional Enhancements
1. **Date Picker UI**: Replace text input with visual date/time picker
   - Install: `@react-native-community/datetimepicker`
   - Better UX than manual text entry
   
2. **Push Notifications**: Notify worker when job time is ending
   - "Your job ends in 30 minutes"
   - "Time to mark your job as complete!"

3. **Calendar View**: Show worker's busy schedule in calendar format
   - Visual representation of accepted jobs
   - Prevent accidental double-booking

4. **Employer Dashboard**: Show scheduled jobs timeline
   - Today's jobs
   - Upcoming jobs
   - Past jobs

---

## ❓ Common Issues & Solutions

### Issue: "scheduled_date not found"
**Solution:** Database migration not run. Open Supabase SQL Editor and run `complete_job_workflow.sql`.

### Issue: Completion modal not appearing
**Solution:** 
1. Check job has `status='accepted'` and `work_status='in_progress'`
2. Verify `scheduled_date` and `scheduled_end_time` are set
3. Ensure current time > end time
4. Check console for errors in `checkForCompletedJobs()`

### Issue: Date format errors
**Solution:** 
- Date must be: `YYYY-MM-DD` (e.g., `2026-01-20`)
- Time must be: `HH:MM` (e.g., `09:00`, `17:00`)
- Use 24-hour format, not 12-hour with AM/PM

### Issue: Worker not marked busy after accepting
**Solution:** 
- Check `accept_job_offer()` function was called successfully
- Verify `employees.busy_until` is set to job end time
- Check for SQL function errors in Supabase logs

---

## 📊 Database Queries for Debugging

### Check Worker's Current Status
```sql
SELECT 
  e.name,
  e.busy_until,
  e.current_job_id,
  jp.title as current_job_title,
  jp.scheduled_date,
  jp.scheduled_start_time,
  jp.scheduled_end_time
FROM employees e
LEFT JOIN job_postings jp ON jp.id = e.current_job_id
WHERE e.id = '<worker_id>';
```

### Find Jobs Needing Completion
```sql
SELECT 
  jp.id,
  jp.title,
  jp.scheduled_date,
  jp.scheduled_end_time,
  jp.expected_completion_at,
  ja.work_status,
  NOW() > (jp.scheduled_date + jp.scheduled_end_time) as should_complete
FROM job_applications ja
JOIN job_postings jp ON jp.id = ja.job_id
WHERE ja.employee_id = '<worker_id>'
  AND ja.status = 'accepted'
  AND ja.work_status = 'in_progress';
```

### Check Conflicting Offers
```sql
SELECT 
  jo.id,
  jo.status,
  jo.rejection_reason,
  jp.title,
  jp.scheduled_date,
  jp.scheduled_start_time,
  jp.scheduled_end_time
FROM job_offers jo
JOIN job_postings jp ON jp.id = jo.job_id
WHERE jo.employee_id = '<worker_id>'
ORDER BY jo.created_at DESC;
```

---

## 🎯 Success Criteria

✅ Employer can post job with date and time  
✅ Worker sees scheduling information  
✅ Worker accepting offer sets busy_until  
✅ Conflicting offers auto-rejected  
✅ Completion modal appears when time expires  
✅ Worker can rate employer and mark complete  
✅ Busy status cleared after completion  

---

## 📞 Support

If you encounter any issues:
1. Check this guide's troubleshooting section
2. Verify database migration was run successfully
3. Check console logs for errors
4. Test with the debugging queries provided above

---

**Implementation Date:** January 2026  
**Status:** ✅ Complete and Ready for Testing
