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