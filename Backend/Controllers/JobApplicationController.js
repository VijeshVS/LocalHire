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
        applied_at,
        job_postings (
          id,
          title,
          wage,
          address,
          duration
        )
      `)
      .eq("employee_id", req.user.id)
      .order("applied_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
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
          scheduled_end_time,
          expected_completion_at
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

    // Check if the job's scheduled time has passed
    const jobPosting = app.job_postings;
    if (jobPosting && jobPosting.expected_completion_at) {
      const expectedCompletion = new Date(jobPosting.expected_completion_at);
      const now = new Date();
      
      if (now < expectedCompletion) {
        const timeRemaining = Math.ceil((expectedCompletion - now) / (1000 * 60)); // minutes
        const hoursRemaining = Math.floor(timeRemaining / 60);
        const minutesRemaining = timeRemaining % 60;
        
        return res.status(400).json({ 
          error: "Cannot mark job as complete before scheduled end time",
          details: `Job is scheduled to end at ${expectedCompletion.toLocaleString()}. Please wait ${hoursRemaining}h ${minutesRemaining}m.`
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