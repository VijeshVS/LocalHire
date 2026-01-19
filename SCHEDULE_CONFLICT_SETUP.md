# Schedule Conflict Detection Setup

This feature prevents workers from accepting multiple jobs at the same time by detecting schedule conflicts.

## Features Implemented

### 1. **Backend - Conflict Detection**
- ✅ SQL functions to detect overlapping job schedules
- ✅ Validation before accepting job offers
- ✅ API endpoints to fetch applications with conflict information
- ✅ Prevents workers from confirming jobs at colliding times

### 2. **Frontend - Visual Indicators**
- ✅ Conflicting jobs shown with **orange/yellow border and background**
- ✅ Warning banner on conflicting job cards
- ✅ Schedule details displayed on job cards
- ✅ Clear error messages when trying to accept conflicting jobs

### 3. **Worker Experience**
- Workers can apply to multiple jobs (even at same time)
- When jobs have overlapping schedules on the same day:
  - Jobs appear with orange/yellow highlighting
  - Warning banner shows "Schedule conflict with other job(s)"
  - Worker can only accept ONE job from the conflicting set
- Jobs on different days have no restrictions

## Setup Instructions

### Step 1: Start the Backend

The migration runs **automatically** when you start the backend:

```bash
cd Backend
npm start
```

The backend will:
1. Check which migrations have been applied
2. Run any pending migrations (including conflict detection)
3. Start the server

You'll see:
```
🔄 Checking database migrations...

📝 Found 1 pending migration(s):
   1. add_schedule_conflict_detection.sql

⏳ Running: add_schedule_conflict_detection.sql...
   ✅ Completed: add_schedule_conflict_detection.sql

✅ All migrations completed successfully!

🚀 Server is running on port 5000
```

### Alternative: Manual Migration (If Needed)

If automatic migration fails, run manually in Supabase SQL Editor:

```sql
-- Copy and paste contents of:
-- Backend/migrations/add_schedule_conflict_detection.sql
```

### Step 2: Test the Feature

#### Create Test Scenario:

1. **As Employer**: Create 2-3 jobs on the same day with overlapping times
   - Job A: Jan 20, 2026, 9:00 AM - 12:00 PM
   - Job B: Jan 20, 2026, 10:00 AM - 2:00 PM
   - Job C: Jan 21, 2026, 9:00 AM - 12:00 PM (different day - no conflict)

2. **As Worker**: Apply to all three jobs
   - Navigate to "My Jobs" → "Applied" tab
   - Jobs A and B will show with **orange/yellow highlighting**
   - Warning banner: "Schedule conflict with other job(s)"
   - Job C shows normally (different day)

3. **Accept One Job**:
   - Accept Job A
   - Try to accept Job B → **Error**: "You have already accepted a job at this time slot"
   - Can still accept Job C (different day)

## How It Works

### Conflict Detection Logic

```sql
-- Two jobs overlap if they are on the same date AND
-- start1 < end2 AND end1 > start2
```

**Examples:**
- ✅ Conflict: 9:00-12:00 and 10:00-14:00 (overlap 10:00-12:00)
- ✅ Conflict: 9:00-17:00 and 12:00-13:00 (lunch inside workday)
- ❌ No conflict: 9:00-12:00 and 12:00-15:00 (back-to-back, no overlap)
- ❌ No conflict: Different dates

### Visual Indicators

| Status | Card Appearance |
|--------|----------------|
| Normal Job | White background, no border |
| Conflicting Job (Applied) | Orange/yellow background, left orange border, warning banner |
| Conflicting Job (Accepted) | Cannot accept another conflicting job |
| Different Day | Normal appearance (no conflict) |

### Worker Flow

```
Worker applies to Jobs A, B, C (A & B conflict)
                    ↓
          My Jobs screen shows:
          - Job A: 🟡 Orange border
          - Job B: 🟡 Orange border  
          - Job C: ⚪ Normal
                    ↓
      Employer sends offer for Job A
                    ↓
         Worker accepts Job A
                    ↓
      Job B now shows: "Another job accepted at this time"
                    ↓
    Worker can still accept Job C (different day)
```

## API Endpoints

### Get Applications with Conflicts
```http
GET /job-applications/my-applications-with-conflicts
Authorization: Bearer <worker_token>

Response:
[
  {
    "id": "app-123",
    "status": "applied",
    "has_conflicts": true,
    "conflicting_application_ids": ["app-456"],
    "can_confirm": false,
    "job_postings": {
      "title": "Plumbing Job",
      "scheduled_date": "2026-01-20",
      "scheduled_start_time": "09:00:00",
      "scheduled_end_time": "12:00:00"
    }
  }
]
```

### Validate Acceptance
```http
GET /job-applications/:application_id/validate-acceptance
Authorization: Bearer <worker_token>

Response:
{
  "can_accept": false,
  "conflict_reason": "You have already accepted a job at this time slot",
  "conflicting_jobs": ["app-789"]
}
```

### Accept Job Offer (Enhanced)
```http
POST /job-offers/:offer_id/accept
Authorization: Bearer <worker_token>

Success Response:
{
  "success": true,
  "message": "Job offer accepted successfully"
}

Conflict Error:
{
  "error": "You have already accepted a job at this time slot. Please complete or cancel it first.",
  "conflicting_jobs": ["app-789"]
}
```

## Database Schema

The migration uses existing columns from `add_job_scheduling.sql`:
- `job_postings.scheduled_date` (DATE)
- `job_postings.scheduled_start_time` (TIME)
- `job_postings.scheduled_end_time` (TIME)

## Troubleshooting

### Issue: Conflicts not showing

**Solution:**
1. Ensure jobs have scheduling info (date, start time, end time)
2. Check that migration ran successfully:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE '%conflict%';
   ```
3. Verify frontend is calling `/my-applications-with-conflicts` endpoint

### Issue: Can't accept any jobs

**Solution:**
1. Check if worker has already accepted a job at that time
2. View accepted jobs: Go to "My Jobs" → "Hired" tab
3. Complete or cancel the conflicting job first

### Issue: All jobs showing as conflicts

**Solution:**
1. Verify job schedules in database
2. Check that dates/times are set correctly
3. Ensure jobs on different days don't conflict

## Testing Checklist

- [ ] Create multiple jobs on same day with overlapping times
- [ ] Create jobs on different days
- [ ] Worker applies to all jobs
- [ ] Verify orange/yellow highlighting on conflicting jobs
- [ ] Accept one job from conflicting set
- [ ] Try to accept another conflicting job → Should show error
- [ ] Verify can still accept jobs on different days
- [ ] Complete accepted job
- [ ] Verify can now accept previously conflicting jobs

## Next Steps

1. ✅ Run the migration
2. ✅ Restart backend
3. ✅ Test with sample jobs
4. Consider adding:
   - Email notifications for conflicts
   - Calendar view of worker's schedule
   - Bulk conflict resolution UI
   - Conflict history tracking

## Support

For issues or questions:
1. Check backend logs for errors
2. Verify SQL functions exist in Supabase
3. Test API endpoints with Postman
4. Check frontend console for error messages
