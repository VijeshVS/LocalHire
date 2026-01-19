# Quick Start: Schedule Conflict Detection

## 🚀 Get Started in 1 Step!

### Just Start the Backend - That's It!

```bash
cd Backend
npm start
```

The backend will **automatically**:
- ✅ Check for pending migrations
- ✅ Run the conflict detection migration
- ✅ Run any other pending migrations
- ✅ Start the server

You'll see output like:
```
🚀 LocalHire Backend Starting...

🔄 Checking database migrations...

✅ All migrations are up to date!

🚀 Server is running on port 5000
```

That's it! The conflict detection is now active.

---

## Alternative: Manual Migration (Optional)

If automatic migrations fail, you can run manually:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `Backend/migrations/add_schedule_conflict_detection.sql`
3. Paste and click "Run"

---

## Test It!

1. **Create Test Jobs** (as Employer):
   - Job A: Tomorrow, 9:00 AM - 12:00 PM
   - Job B: Tomorrow, 10:00 AM - 2:00 PM (overlaps with A)
   - Job C: Day after tomorrow, 9:00 AM - 12:00 PM

2. **Apply for Jobs** (as Worker):
   - Go to job search
   - Apply to all three jobs

3. **Check My Jobs**:
   - Open "My Jobs" → "Applied" tab
   - Jobs A & B will have **orange/yellow highlighting** 🟡
   - You'll see: "⚠️ Schedule conflict with other job"

4. **Try to Accept**:
   - Accept Job A ✅
   - Try to accept Job B ❌ → Error: "You have already accepted a job at this time slot"
   - Accept Job C ✅ (different day, no conflict)

## ✨ What You Get

### Visual Indicators
- 🟡 **Orange border** on conflicting jobs
- 🟡 **Yellow background** for easy spotting
- ⚠️ **Warning banner** showing conflict count
- 📅 **Schedule details** on each job card

### Smart Prevention
- ✅ Apply to unlimited jobs
- ✅ See which ones conflict
- ✅ Accept only ONE per time slot
- ✅ Jobs on different days = no problem

## 🎯 How It Works

```
Worker Flow:
Apply to Jobs A, B, C
    ↓
Jobs A & B show 🟡 (same time)
Job C shows ⚪ (different day)
    ↓
Accept Job A ✅
    ↓
Try Job B → ❌ "Already have a job at this time"
Accept Job C ✅
```

## 📋 Quick Test Checklist

- [ ] Migration runs without errors
- [ ] Backend restarts successfully  
- [ ] Create jobs with overlapping times
- [ ] Conflicting jobs show orange styling
- [ ] Can accept one from conflict set
- [ ] Cannot accept second conflicting job
- [ ] Can accept jobs on different days

## 🆘 Troubleshooting

**Not seeing orange cards?**
- Make sure jobs have scheduled_date, scheduled_start_time, scheduled_end_time
- Refresh the My Jobs screen
- Check browser console for errors

**Can't accept any jobs?**
- Check if you already accepted a job at that time
- Go to "My Jobs" → "Hired" tab
- Complete the existing job first

**Migration errors?**
- Use Option B (manual) instead
- Check Supabase logs
- Ensure you have correct permissions

## 📚 Full Documentation

- **Setup Guide:** `SCHEDULE_CONFLICT_SETUP.md`
- **Implementation Details:** `SCHEDULE_CONFLICT_IMPLEMENTATION.md`
- **SQL Migration:** `Backend/migrations/add_schedule_conflict_detection.sql`

## 🎨 Color Reference

| Color | Meaning |
|-------|---------|
| 🟡 Orange/Yellow | Time conflict detected |
| ⚪ White | No conflict |
| 🟢 Green | Completed job |
| 🔴 Red | Rejected application |

## 🔧 Development

**API Endpoints:**
```
GET /job-applications/my-applications-with-conflicts
GET /job-applications/:id/validate-acceptance
POST /job-offers/:id/accept (enhanced with conflict check)
```

**Frontend Services:**
```typescript
import { 
  getMyApplicationsWithConflicts,
  validateJobAcceptance,
  getWorkerSchedule 
} from '@/services';
```

## 💡 Pro Tips

1. **For Employers:** Schedule jobs at different times to avoid conflicts
2. **For Workers:** Check "My Jobs" before accepting new offers
3. **Testing:** Use same-day jobs to see conflicts in action
4. **Production:** Worker should complete jobs to unlock new time slots

## ✅ Success Indicators

You'll know it's working when:
- Orange cards appear for same-time jobs
- Error shows when accepting conflicting jobs
- Different-day jobs work normally
- Warning banner displays conflict count

---

**Need Help?** Check the full documentation files or contact support!
