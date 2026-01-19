const { supabase } = require("../config/SupabaseClient.js");
const { createNotification } = require("./NotificationController.js");

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

    // Fetch applications with employee details and work_status
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        status,
        applied_at,
        work_status,
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
      .select(`
        id, 
        employee_id,
        job_posting_id,
        job_postings!inner(employer_id, title)
      `)
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

    if (error) {
      console.error("Error updating application status:", error);
      return res.status(400).json({ error: error.message || "Failed to update application status" });
    }

    // Get employer name for notification
    const { data: employer } = await supabase
      .from("employers")
      .select("name, company_name")
      .eq("id", employer_id)
      .single();

    const employerName = employer?.company_name || employer?.name || "An employer";
    const jobTitle = application.job_postings?.title || "a job";

    // Send notification to employee based on status
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType = "";

    switch (status) {
      case "accepted":
        notificationType = "application_accepted";
        notificationTitle = "🎉 Congratulations! You're Hired!";
        notificationMessage = `${employerName} has accepted your application for "${jobTitle}". You can now message them to discuss next steps.`;
        break;
      case "rejected":
        notificationType = "application_rejected";
        notificationTitle = "Application Update";
        notificationMessage = `Your application for "${jobTitle}" was not selected this time. Keep applying for more opportunities!`;
        break;
      case "shortlisted":
        notificationType = "application_shortlisted";
        notificationTitle = "🌟 You've Been Shortlisted!";
        notificationMessage = `Great news! ${employerName} has shortlisted you for "${jobTitle}". They may contact you soon.`;
        break;
    }

    if (notificationType) {
      await createNotification(
        application.employee_id,
        "EMPLOYEE",
        notificationType,
        notificationTitle,
        notificationMessage,
        { 
          job_id: application.job_posting_id, 
          application_id: application_id,
          employer_id: employer_id
        }
      );
    }

    res.json({ message: `Application status updated to ${status}`, data });
  } catch (err) {
    console.error("Error updating application status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};