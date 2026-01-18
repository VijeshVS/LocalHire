# 🚀 Quick Start - Run This First!

## ⚠️ IMPORTANT: Database Migration Required

Before testing the job offers feature, you MUST run the database migration.

### Step-by-Step Instructions:

1. **Open the migration file**
   - Navigate to: `Backend/migrations/add_job_offers.sql`
   - Open it in your code editor
   - Select all content (Ctrl+A)
   - Copy (Ctrl+C)

2. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click on "SQL Editor" in the left sidebar

3. **Run the migration**
   - Click "New Query" button
   - Paste the copied SQL (Ctrl+V)
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for "Success" message

4. **Verify tables created**
   - Go to "Table Editor" in left sidebar
   - You should see a new table: `job_offers`
   - Check if it has columns: id, job_application_id, employee_id, employer_id, offer_status, etc.

5. **Done!** ✅
   - Your database is now ready for job offers
   - Backend will work correctly
   - Workers can now see and manage job offers

### What This Migration Does:

- ✅ Creates `job_offers` table
- ✅ Creates database functions for conflict checking
- ✅ Creates triggers for automatic offer creation
- ✅ Creates triggers for offer expiration
- ✅ Creates view for easy querying

### If Migration Fails:

**Error: "relation already exists"**
- The migration was already run
- You're good to go!

**Error: "permission denied"**
- Make sure you're using the correct Supabase project
- Check if you have admin access

**Error: "syntax error"**
- Make sure you copied the ENTIRE file
- Check for any missing characters

### After Migration:

Start using the app:
1. Login as worker
2. Apply to jobs
3. Wait for employer to accept
4. Check "Job Offers" screen (briefcase icon on home)
5. Accept or reject offers

---

## 📱 Testing the Feature

### Scenario 1: Single Offer
1. Employer posts a job
2. Worker applies
3. Employer accepts application
4. Worker sees offer in "Job Offers" screen
5. Worker accepts offer
6. ✅ Job is confirmed

### Scenario 2: Multiple Offers (No Conflict)
1. Employer A posts Job 1 (Monday 9am-5pm)
2. Employer B posts Job 2 (Tuesday 9am-5pm)
3. Worker applies to both
4. Both employers accept
5. Worker sees 2 offers
6. Worker can accept both (no time conflict)
7. ✅ Both jobs confirmed

### Scenario 3: Multiple Offers (With Conflict)
1. Employer A posts Job 1 (Monday 9am-5pm)
2. Employer B posts Job 2 (Monday 2pm-6pm) ← OVERLAPS
3. Worker applies to both
4. Both employers accept
5. Worker sees 2 offers
6. Job 2 shows ⚠️ CONFLICT warning
7. Worker accepts Job 1
8. ✅ Job 2 is automatically rejected
9. Only Job 1 in worker's schedule

---

## 🎯 Quick Reference

### API Endpoints (for testing with Postman):

```
GET    /api/job-offers              - Get worker's offers
POST   /api/job-offers/:id/accept   - Accept an offer
POST   /api/job-offers/:id/reject   - Reject an offer
GET    /api/job-offers/:id          - Get offer details
GET    /api/job-offers/schedule     - Get worker's schedule
POST   /api/job-offers/check-availability
GET    /api/job-offers/stats        - Get statistics
```

All require: `Authorization: Bearer <token>`

### Database Tables:

- `job_offers` - Stores all offers
- `job_applications` - Worker applications
- `job_postings` - Employer job posts
- `employees` - Worker profiles
- `employers` - Employer profiles

### Key Files:

**Backend:**
- `Backend/migrations/add_job_offers.sql` ← RUN THIS FIRST!
- `Backend/Controllers/JobOfferController.js`
- `Backend/Routers/JobOfferRoute.js`

**Frontend:**
- `frontend/app/(worker)/job-offers.tsx` - Main screen
- `frontend/services/jobOfferService.ts` - API calls
- `frontend/app/(worker)/home.tsx` - Badge display

---

## 📚 Documentation

For more details, see:
- `JOB_OFFERS_SETUP.md` - Complete setup guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `SETUP_GUIDE.md` - General app setup

---

## ✅ Checklist

Before reporting issues, check:
- [ ] Migration ran successfully
- [ ] Backend is running (port 5000)
- [ ] Frontend is running (Expo)
- [ ] You're logged in as worker
- [ ] There are pending offers (employer accepted application)
- [ ] Check console for error messages

---

**Need Help?** Check the troubleshooting section in `JOB_OFFERS_SETUP.md`
