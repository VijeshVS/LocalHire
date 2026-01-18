# Job Offers System Setup

## Overview
The job offers system allows workers to receive and choose from multiple job offers from different employers. It includes automatic scheduling conflict detection to prevent double-booking.

## Features
- ✅ Multiple employers can offer jobs to the same worker
- ✅ Workers can view all pending offers in one place
- ✅ Workers can accept or reject offers
- ✅ Automatic scheduling conflict detection
- ✅ Offers expire after 24 hours
- ✅ Conflicting offers are auto-rejected when worker accepts a job
- ✅ Real-time availability checking

## Setup Instructions

### 1. Run Database Migration

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Open the file: `Backend/migrations/add_job_offers.sql`
4. Copy all the contents
5. Paste into Supabase SQL Editor
6. Click "Run" to execute the migration

This will create:
- `job_offers` table
- `worker_job_offers` view
- `is_worker_available()` function
- `get_worker_schedule_conflicts()` function
- `accept_job_offer()` function
- `reject_job_offer()` function
- Triggers for automatic offer creation and expiration

### 2. Verify Backend Routes

The backend routes are already configured in `Backend/index.js`:
```javascript
app.use('/api/job-offers', jobOfferRoute);
```

All job offer endpoints are protected and require worker authentication.

### 3. Test the System

#### For Employers:
1. Post a job
2. Wait for workers to apply
3. Accept an application
4. An offer is automatically created and sent to the worker

#### For Workers:
1. Apply to multiple jobs
2. When employers accept your applications, you'll see offers
3. Navigate to the Job Offers screen (briefcase icon on home screen)
4. Review offers with details:
   - Job title and description
   - Employer information
   - Pay rate and duration
   - Schedule (date and time)
   - Location
   - Availability status (conflict warning if already booked)
5. Accept or reject offers
6. When you accept an offer:
   - The job is added to your schedule
   - Any conflicting offers are automatically rejected
   - The employer is notified

## API Endpoints

### Worker Endpoints (require authentication)

- `GET /api/job-offers` - Get all pending offers for the worker
- `POST /api/job-offers/:offerId/accept` - Accept a job offer
- `POST /api/job-offers/:offerId/reject` - Reject a job offer
- `GET /api/job-offers/:offerId` - Get details of a specific offer
- `GET /api/job-offers/schedule` - Get worker's current schedule
- `POST /api/job-offers/check-availability` - Check availability for a time slot
- `GET /api/job-offers/stats` - Get offer statistics

## How It Works

### 1. Offer Creation
When an employer accepts a job application:
- A trigger automatically creates a job offer
- The offer status is set to 'pending'
- The offer expires in 24 hours
- Worker receives a notification (if enabled)

### 2. Conflict Detection
Before accepting an offer, the system:
- Checks if the worker has any existing jobs during that time
- Identifies all conflicting offers
- Warns the worker about conflicts
- Auto-rejects conflicting offers if worker proceeds with acceptance

### 3. Offer Acceptance
When a worker accepts an offer:
1. System validates scheduling conflicts
2. Updates job_applications status to 'confirmed'
3. Updates job_postings status to 'in_progress'
4. Marks offer as 'accepted'
5. Rejects all conflicting offers
6. Sends notification to employer
7. Adds job to worker's schedule

### 4. Offer Rejection
When a worker rejects an offer:
1. Offer status is updated to 'rejected'
2. Employer is notified
3. Job remains available for other workers

### 5. Expiration
Offers automatically expire after 24 hours:
- A database trigger checks for expired offers
- Expired offers are marked as 'expired'
- Employers can view expired offers in their dashboard

## Database Schema

### job_offers Table
```sql
- id (UUID, primary key)
- job_application_id (foreign key)
- employee_id (foreign key to workers)
- employer_id (foreign key)
- offer_status (pending/accepted/rejected/expired)
- offered_at (timestamp)
- expires_at (timestamp, default 24 hours)
- created_at
- updated_at
```

### worker_job_offers View
Combines data from job_offers, job_applications, and job_postings to provide:
- All offer details
- Job information
- Employer information
- Availability status for each offer

## Frontend Components

### Job Offers Screen
Location: `frontend/app/(worker)/job-offers.tsx`

Features:
- List of all pending offers
- Offer cards with:
  - Job title and details
  - Employer information
  - Pay and duration
  - Schedule
  - Location
  - Expiration countdown
  - Conflict warnings
- Accept/Reject buttons with confirmations
- Pull-to-refresh
- Loading and error states

### Worker Home Screen Updates
Location: `frontend/app/(worker)/home.tsx`

Added:
- Job offers badge showing count of pending offers
- Briefcase icon button to navigate to offers screen
- Auto-refresh offers count on screen load

## Troubleshooting

### "Worker is not available during this time"
- The worker already has a job scheduled during that time
- Check the worker's schedule using the `/schedule` endpoint
- The worker needs to reject the conflicting job first

### Offers not appearing
- Ensure the database migration ran successfully
- Check that the employer accepted the application (not just viewed it)
- Verify the offer hasn't expired
- Check backend logs for errors

### Cannot accept offer
- Ensure worker is authenticated (valid JWT token)
- Check if the offer is still pending
- Verify no database errors in backend logs
- Ensure all foreign key relationships are valid

## Next Steps

To enhance the system further:
1. Add push notifications for new offers
2. Implement offer negotiation (counter-offers)
3. Add offer history view
4. Create employer dashboard for tracking offers
5. Add analytics for offer acceptance rates
6. Implement batch operations (accept/reject multiple)
7. Add filters and sorting for offers
8. Create calendar view of scheduled jobs

## Support

For issues or questions:
1. Check backend logs: `npm run dev` in Backend directory
2. Check Supabase logs in the dashboard
3. Use the API testing tools in Postman or similar
4. Verify authentication tokens are valid
5. Ensure all migrations ran successfully
