const { supabase } = require("../config/SupabaseClient.js");

/* --- 1. GET ALL APPLICATIONS FOR A SPECIFIC JOB --- */
exports.getJobApplications = async (req, res) => {
  try {
    const { job_id } = req.params;
    const employer_id = req.user.id; // From JWT

    // Security Check: Ensure this job belongs to the logged-in employer
    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("id")
      .eq("id", job_id)
      .eq("employer_id", employer_id)
      .single();

    if (jobError || !job) {
      return res.status(403).json({ error: "Unauthorized or job not found" });
    }

    // Fetch applications with employee details
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        status,
        applied_at,
        employees (
          id,
          name,
          email,
          phone,
          years_of_experience,
          language
        )
      `)
      .eq("job_posting_id", job_id)
      .order("applied_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 2. UPDATE APPLICATION STATUS (Accept/Reject/Shortlist) --- */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { status } = req.body; // expected: 'shortlisted', 'accepted', or 'rejected'
    const employer_id = req.user.id;

    if (!['shortlisted', 'accepted', 'rejected', 'applied'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Security Check: Only allow update if this application belongs to a job owned by this employer
    const { data: application, error: fetchError } = await supabase
      .from("job_applications")
      .select("id, job_postings!inner(employer_id)")
      .eq("id", application_id)
      .eq("job_postings.employer_id", employer_id)
      .single();

    if (fetchError || !application) {
      return res.status(403).json({ error: "Unauthorized to update this application" });
    }

    const { data, error } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", application_id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: `Application status updated to ${status}`, data });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};