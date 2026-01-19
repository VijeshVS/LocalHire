# Schedule Conflict Detection - Implementation Summary

## Overview
Implemented a comprehensive schedule conflict detection system that prevents workers from accepting multiple jobs at the same time. Workers can apply to multiple jobs, but they can only confirm/accept one job per time slot.

## Changes Made

### 1. Database Layer (SQL)

**File:** `Backend/migrations/add_schedule_conflict_detection.sql`

**New Functions:**
- `check_time_overlap()` - Checks if two date-time ranges overlap
- `get_worker_schedule_conflicts()` - Returns all worker jobs with conflict information
- `can_accept_job_without_conflict()` - Validates if a job can be accepted without conflicts

**Indexes Added:**
- `idx_job_postings_schedule` - For faster schedule queries
- `idx_job_applications_employee_status` - For filtering by worker and status

**Migration System:**
- Created `Backend/utils/migrations.js` - Automatic migration runner
- Integrated into `Backend/index.js` - Runs on server startup
- Tracks applied migrations in `_applied_migrations` table

### 2. Backend API

**File:** `Backend/Controllers/JobApplicationController.js`

**New Endpoints:**
1. `getMyApplicationsWithConflicts()` 
   - Route: `GET /job-applications/my-applications-with-conflicts`
   - Returns applications with conflict flags and conflicting job IDs

2. `validateJobAcceptance()`
   - Route: `GET /job-applications/:id/validate-acceptance`
   - Checks if accepting a job would create conflicts

**File:** `Backend/Controllers/JobOfferController.js`

**Enhanced Endpoint:**
- `acceptJobOffer()` - Now validates schedule conflicts before accepting
  - Prevents accepting offers that conflict with already-accepted jobs
  - Returns clear error messages about conflicts

**File:** `Backend/Routers/JobApplicationRoute.js`

**New Routes:**
```javascript
GET /job-applications/my-applications-with-conflicts
GET /job-applications/:application_id/validate-acceptance
```

### 3. Frontend Services

**File:** `frontend/services/applicationService.ts`

**Updated Interface:**
```typescript
interface Application {
  // ... existing fields
  has_conflicts?: boolean;
  conflicting_application_ids?: string[];
  can_confirm?: boolean;
  job_postings?: {
    // ... existing fields
    scheduled_date?: string;
    scheduled_start_time?: string;
    scheduled_end_time?: string;
  };
}
```

**New Functions:**
- `getMyApplicationsWithConflicts()` - Fetches applications with conflict data
- `validateJobAcceptance()` - Validates acceptance before confirming

### 4. Frontend UI

**File:** `frontend/app/(worker)/my-jobs.tsx`

**Visual Changes:**
- Jobs with conflicts display with **orange/yellow styling**
- Orange left border (4px) on conflicting job cards
- Light yellow background (#fffbeb)
- Warning banner at top of conflicting cards
- Schedule information displayed on job cards
- Warning message for jobs that can't be confirmed

**New Styles:**
```typescript
conflictCard: {
  borderLeftWidth: 4,
  borderLeftColor: '#f59e0b',
  backgroundColor: '#fffbeb',
}
```

**File:** `frontend/app/(worker)/job-offers.tsx`

**Enhanced Error Handling:**
- Better error messages for schedule conflicts
- Clear alert when trying to accept conflicting offers
- Guides worker to complete/cancel existing job first

### 5. Documentation

**New Files:**
1. `SCHEDULE_CONFLICT_SETUP.md` - Complete setup and testing guide
2. `Backend/utils/migrations.js` - Automatic migration runner (integrated into startup)

## How It Works

### Conflict Detection Flow

```
1. Worker applies to multiple jobs
   ↓
2. Frontend calls: GET /my-applications-with-conflicts
   ↓
3. Backend SQL function checks for overlapping schedules
   ↓
4. Returns conflict flags for each application
   ↓
5. Frontend displays conflicting jobs with orange styling
   ↓
6. When worker tries to accept a job:
   - Backend validates: can_accept_job_without_conflict()
   - If conflict exists → Error
   - If no conflict → Accept
```

### Conflict Rules

**Jobs Conflict When:**
- Same date (scheduled_date matches)
- AND overlapping times: `start1 < end2 AND end1 > start2`

**Examples:**
- ✅ 9:00-12:00 & 10:00-14:00 → Conflict (2-hour overlap)
- ✅ 8:00-17:00 & 12:00-13:00 → Conflict (lunch inside workday)
- ❌ 9:00-12:00 & 12:00-15:00 → No conflict (back-to-back)
- ❌ Different dates → Never conflict

**Worker Can:**
- Apply to unlimited jobs (even conflicting ones)
- See which jobs conflict (visual indicators)
- Accept only ONE job from a conflicting set
- Accept jobs on different days without restriction

**Worker Cannot:**
- Accept multiple jobs at the same time
- Confirm a job if already confirmed another at that time

## Visual Indicators

| Scenario | Visual Appearance |
|----------|-------------------|
| Normal application | White card, no special styling |
| Conflicting jobs (applied) | Orange left border, yellow background, warning banner |
| Another job accepted (conflict) | Orange styling + "Another job accepted" message |
| Different day jobs | Normal styling (no conflict) |

## Setup Instructions

### Quick Start

**Just start the backend - migrations run automatically!**

```bash
cd Backend
npm start
```

The backend will:
1. Check for pending migrations
2. Run `add_schedule_conflict_detection.sql` (and any others)
3. Start the server

**Manual Alternative** (if automatic fails):
- Copy `Backend/migrations/add_schedule_conflict_detection.sql`
- Paste and run in Supabase SQL Editor

### Testing Checklist

- [ ] Migration runs successfully
- [ ] Backend starts without errors
- [ ] Create test jobs with overlapping times
- [ ] Worker can apply to all jobs
- [ ] Conflicting jobs show with orange styling
- [ ] Can accept one job from conflicting set
- [ ] Cannot accept second conflicting job
- [ ] Error message is clear and helpful
- [ ] Can accept jobs on different days
- [ ] Complete job and verify can accept others

## API Reference

### Get Applications with Conflicts
```http
GET /api/job-applications/my-applications-with-conflicts
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "status": "applied",
    "has_conflicts": true,
    "conflicting_application_ids": ["uuid1", "uuid2"],
    "can_confirm": false,
    "job_postings": {
      "title": "Job Title",
      "scheduled_date": "2026-01-20",
      "scheduled_start_time": "09:00:00",
      "scheduled_end_time": "12:00:00"
    }
  }
]
```

### Validate Acceptance
```http
GET /api/job-applications/:id/validate-acceptance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "can_accept": false,
  "conflict_reason": "You have already accepted a job at this time slot",
  "conflicting_jobs": ["uuid"]
}
```

## Files Modified

### Backend
- ✅ `Backend/migrations/add_schedule_conflict_detection.sql` (new)
- ✅ `Backend/Controllers/JobApplicationController.js` (modified)
- ✅ `Backend/Controllers/JobOfferController.js` (modified)
- ✅ `Backend/Routers/JobApplicationRoute.js` (modified)
- ✅ `Backend/run-conflict-migration.js` (new)

### Frontend
- ✅ `frontendutils/migrations.js` (new - automatic migration runner)
- ✅ `Backend/index.js` (modified - runs migrations on startup)
- ✅ `Backend/Controllers/JobApplicationController.js` (modified)
- ✅ `Backend/Controllers/JobOfferController.js` (modified)
- ✅ `Backend/Routers/JobApplicationRoute.js` (modified
### Documentation
- ✅ `SCHEDULE_CONFLICT_SETUP.md` (new)
- ✅ `SCHEDULE_CONFLICT_IMPLEMENTATION.md` (this file)

## Deployment Notes
Migrations run automatically on backend startup
2. **Backend:** Just deploy and start - migrations handle themselves
3. **Frontend:** Deploy updated UI components
4. **Testing:** Verify with staging data before production

**Zero-downtime deployment:**
- Migrations are idempotent (safe to run multiple times)
- Uses migration tracking table to avoid re-running
- Server starts even if migrations have issues
4. **Testing:** Verify with staging data before production

## Future Enhancements

Potential improvements:
- [ ] Calendar view of worker's schedule
- [ ] Email notifications for conflicts
- [ ] Bulk conflict resolution UI
- [ ] Conflict history tracking
- [ ] Smart scheduling suggestions
- [ ] Auto-reject conflicting offers
- [ ] Worker availability preferences

## Troubleshooting

**Issue:** Conflicts not showing
- Verify jobs have schedule data (date, start, end times)
- Check migration ran successfully
- Confirm frontend calling correct endpoint

**Issue:** Can't accept any jobs
- Check if worker already accepted job at that time
- View accepted jobs in "Hired" tab
- Complete or cancel conflicting job first

**Issue:** All jobs showing conflicts
- Verify job schedules in database
- Ensure dates/times are correct
- Check timezone handling

## Support

For issues:
1. Check backend logs
2. Verify SQL functions in Supabase
3. Test API endpoints with Postman
4. Review frontend console errors
5. See `SCHEDULE_CONFLICT_SETUP.md` for detailed guide
