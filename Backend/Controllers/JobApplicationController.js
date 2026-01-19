const crypto = require("crypto");
const { supabase } = require("../config/SupabaseClient.js");

/* --- 1. APPLY FOR A JOB --- */
exports.applyForJob = async (req, res) => {
  try {
    const { job_posting_id } = req.body;
    const employee_id = req.user.id; // Pulled from JWT
    const id = crypto.randomUUID();

    if (!job_posting_id) {
      return res.status(400).json({ error: "Job Posting ID is required" });
    }

    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        id,
        job_posting_id,
        employee_id,
        status: "applied"
      })
      .select();

    if (error) {
      // Handle the UNIQUE constraint error (if they already applied)
      if (error.code === '23505') {
        return res.status(400).json({ error: "You have already applied for this job" });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Application submitted successfully", data: data[0] });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 2. GET SPECIFIC APPLICATION BY ID --- */
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        *,
        job_postings (
          title,
          description,
          wage,
          address,
          employer_id
        )
      `)
      .eq("id", id)
      .eq("employee_id", req.user.id) // Security: Only the owner can view it
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Application not found or unauthorized" });
    }

    res.json(data);
  } catch (err) {
    console.error("GET APPLICATION ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 3. GET ALL MY APPLICATIONS --- */
exports.getMyApplications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        status,
        work_status,
        applied_at,
        completed_at,
        job_postings (
          id,
          title,
          wage,
          address,
          duration,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          is_active
        )
      `)
      .eq("employee_id", req.user.id)
      .order("applied_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    
    // Filter out applications where the job has been deleted (job_postings is null)
    // and mark jobs as deleted if they exist but is_active is false
    const filteredData = (data || []).map(app => {
      if (!app.job_postings) {
        return { ...app, job_deleted: true, job_postings: { title: 'Job Deleted', wage: 0, address: 'N/A', duration: 'N/A' } };
      }
      return app;
    });
    
    res.json(filteredData);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 4. DELETE (WITHDRAW) APPLICATION --- */
exports.withdrawApplication = async (req, res) => {
  try {
    const { application_id } = req.params;

    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", application_id)
      .eq("employee_id", req.user.id); // Security: Can only delete your own application

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Application withdrawn successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 5. MARK JOB AS COMPLETED (Worker) --- */
exports.markJobCompleted = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { completion_notes, rating, review } = req.body;

    // Get the application and job details to check scheduling
    const { data: app, error: fetchError } = await supabase
      .from("job_applications")
      .select(`
        *,
        job_postings (
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          expected_completion_at,
          duration_hours
        )
      `)
      .eq("id", application_id)
      .eq("employee_id", req.user.id)
      .single();

    if (fetchError || !app) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (app.status !== 'accepted') {
      return res.status(400).json({ error: "Can only complete accepted jobs" });
    }

    if (app.work_status === 'completed') {
      return res.status(400).json({ error: "Job is already marked as completed" });
    }

    // Check if the job's scheduled time has passed
    const jobPosting = app.job_postings;
    const now = new Date();
    
    // Check various ways to determine if job time has ended
    if (jobPosting) {
      let jobEndTime = null;
      
      // Option 1: Check expected_completion_at
      if (jobPosting.expected_completion_at) {
        jobEndTime = new Date(jobPosting.expected_completion_at);
      }
      // Option 2: Check scheduled_date + scheduled_end_time
      else if (jobPosting.scheduled_date && jobPosting.scheduled_end_time) {
        const dateStr = jobPosting.scheduled_date;
        const timeStr = jobPosting.scheduled_end_time;
        jobEndTime = new Date(`${dateStr}T${timeStr}`);
      }
      // Option 3: Check scheduled_date + scheduled_start_time + duration_hours
      else if (jobPosting.scheduled_date && jobPosting.scheduled_start_time && jobPosting.duration_hours) {
        const dateStr = jobPosting.scheduled_date;
        const timeStr = jobPosting.scheduled_start_time;
        jobEndTime = new Date(`${dateStr}T${timeStr}`);
        jobEndTime.setHours(jobEndTime.getHours() + jobPosting.duration_hours);
      }
      
      // If we have an end time and it's in the future, block completion
      if (jobEndTime && now < jobEndTime) {
        const timeRemaining = Math.ceil((jobEndTime.getTime() - now.getTime()) / (1000 * 60)); // minutes
        const hoursRemaining = Math.floor(timeRemaining / 60);
        const minutesRemaining = timeRemaining % 60;
        
        let timeMessage = '';
        if (hoursRemaining > 0) {
          timeMessage = `${hoursRemaining}h ${minutesRemaining}m`;
        } else {
          timeMessage = `${minutesRemaining} minutes`;
        }
        
        return res.status(400).json({ 
          error: "Cannot mark job as complete yet",
          details: `The job is scheduled to end at ${jobEndTime.toLocaleString()}. Please wait ${timeMessage} until the scheduled end time.`,
          scheduled_end: jobEndTime.toISOString()
        });
      }
    }

    // Update the application
    const { data, error } = await supabase
      .from("job_applications")
      .update({
        work_status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completion_notes || null,
        employer_rating: rating || null,
        employer_review: review || null,
        employer_confirmation_pending: true, // Flag for employer to confirm
      })
      .eq("id", application_id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Job marked as completed", data: data[0] });
  } catch (err) {
    console.error("MARK COMPLETED ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 6. CONFIRM JOB COMPLETION (Employer) --- */
exports.confirmJobCompletion = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { rating, review } = req.body;

    // Get the application and verify employer owns the job
    const { data: app, error: fetchError } = await supabase
      .from("job_applications")
      .select(`
        *,
        job_postings!inner(employer_id)
      `)
      .eq("id", application_id)
      .single();

    if (fetchError || !app) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (app.job_postings.employer_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (app.work_status !== 'completed') {
      return res.status(400).json({ error: "Worker must mark job as completed first" });
    }

    // Update with employer's rating
    const { data, error } = await supabase
      .from("job_applications")
      .update({
        worker_rating: rating || null,
        worker_review: review || null,
        employer_confirmation_pending: false, // Clear pending flag
      })
      .eq("id", application_id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    // Update worker's overall rating
    if (rating) {
      await updateWorkerRating(app.employee_id);
    }

    res.json({ message: "Job completion confirmed", data: data[0] });
  } catch (err) {
    console.error("CONFIRM COMPLETION ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to update worker's average rating
async function updateWorkerRating(employeeId) {
  try {
    const { data: applications } = await supabase
      .from("job_applications")
      .select("worker_rating")
      .eq("employee_id", employeeId)
      .not("worker_rating", "is", null);

    if (applications && applications.length > 0) {
      const avgRating = applications.reduce((sum, app) => sum + app.worker_rating, 0) / applications.length;
      
      await supabase
        .from("employees")
        .update({ rating: Math.round(avgRating * 10) / 10 })
        .eq("id", employeeId);
    }
  } catch (err) {
    console.error("Error updating worker rating:", err);
  }
}

/* --- 7. GET PENDING CONFIRMATIONS (Employer) --- */
exports.getPendingConfirmations = async (req, res) => {
  try {
    const employer_id = req.user.id;

    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        completed_at,
        completion_notes,
        work_status,
        job_postings!inner (
          id,
          title,
          employer_id,
          scheduled_date,
          expected_completion_at
        ),
        employees (
          id,
          name,
          rating
        )
      `)
      .eq("job_postings.employer_id", employer_id)
      .eq("work_status", "completed")
      .eq("employer_confirmation_pending", true)
      .order("completed_at", { ascending: true });

    if (error) {
      console.error("GET PENDING ERROR:", error);
      return res.status(400).json({ error: error.message });
    }

    // Format the response with days pending
    const formatted = (data || []).map(app => {
      const daysPending = app.completed_at 
        ? Math.floor((Date.now() - new Date(app.completed_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        application_id: app.id,
        job_title: app.job_postings?.title || 'Unknown Job',
        worker_name: app.employees?.name || 'Unknown Worker',
        worker_rating: app.employees?.rating || 0,
        completed_at: app.completed_at,
        completion_notes: app.completion_notes,
        days_pending: daysPending,
        job_id: app.job_postings?.id
      };
    });

    res.json({ 
      message: "Pending confirmations retrieved", 
      count: formatted.length,
      data: formatted 
    });
  } catch (err) {
    console.error("GET PENDING CONFIRMATIONS ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 10. GET WORKER'S APPLICATIONS WITH SCHEDULE CONFLICTS --- */
exports.getMyApplicationsWithConflicts = async (req, res) => {
  try {
    const employee_id = req.user.id;

    // Try to get conflict information (but don't fail if function doesn't exist)
    let conflictData = null;
    try {
      const { data, error } = await supabase
        .rpc('get_worker_schedule_conflicts', { worker_id: employee_id });
      
      if (!error) {
        conflictData = data;
      } else {
        console.log("Conflict detection not available:", error.message);
      }
    } catch (e) {
      console.log("Conflict detection skipped:", e.message);
    }

    // Get all applications
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        *,
        job_postings (
          id,
          title,
          category,
          description,
          wage,
          duration,
          address,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          employer:employers (
            name,
            business_name
          )
        )
      `)
      .eq("employee_id", employee_id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    // Merge conflict data with applications (if available)
    const applicationsWithConflicts = (data || []).map(app => {
      const conflictInfo = conflictData?.find(c => c.application_id === app.id);
      return {
        ...app,
        has_conflicts: conflictInfo?.has_conflicts || false,
        conflicting_application_ids: conflictInfo?.conflicting_application_ids || [],
        can_confirm: conflictInfo?.can_confirm !== false
      };
    });

    res.json(applicationsWithConflicts);
  } catch (err) {
    console.error("Get applications with conflicts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 11. VALIDATE JOB ACCEPTANCE (Check for conflicts) --- */
exports.validateJobAcceptance = async (req, res) => {
  try {
    const { application_id } = req.params;
    const employee_id = req.user.id;

    // Get the application details
    const { data: app, error: appError } = await supabase
      .from("job_applications")
      .select("job_posting_id")
      .eq("id", application_id)
      .eq("employee_id", employee_id)
      .single();

    if (appError || !app) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Check if accepting this job would create conflicts
    const { data: validation, error: validationError } = await supabase
      .rpc('can_accept_job_without_conflict', {
        worker_id: employee_id,
        new_job_id: app.job_posting_id
      });

    if (validationError) {
      console.error("Validation error:", validationError);
      return res.status(500).json({ error: "Failed to validate acceptance" });
    }

    const result = validation?.[0];
    
    res.json({
      can_accept: result?.can_accept || true,
      conflict_reason: result?.conflict_reason,
      conflicting_jobs: result?.conflicting_jobs || []
    });
  } catch (err) {
    console.error("Validate acceptance error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};