const { supabase } = require("../config/SupabaseClient.js");
const { createNotification } = require("./NotificationController.js");

/* --- 1. GET ALL JOB OFFERS FOR WORKER --- */
exports.getWorkerJobOffers = async (req, res) => {
  try {
    const employee_id = req.user.id;

    const { data, error } = await supabase
      .from("worker_job_offers")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("offer_status", "pending")
      .order("offered_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    // Filter out expired offers and offers with conflicts
    const validOffers = (data || []).filter(offer => !offer.is_expired);

    res.json({
      count: validOffers.length,
      offers: validOffers
    });
  } catch (err) {
    console.error("Error fetching job offers:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 2. GET SINGLE JOB OFFER DETAILS --- */
exports.getJobOfferDetails = async (req, res) => {
  try {
    const { offer_id } = req.params;
    const employee_id = req.user.id;

    const { data, error } = await supabase
      .from("worker_job_offers")
      .select("*")
      .eq("offer_id", offer_id)
      .eq("employee_id", employee_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Job offer not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching job offer:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 3. ACCEPT JOB OFFER --- */
exports.acceptJobOffer = async (req, res) => {
  try {
    const { offer_id } = req.params;
    const employee_id = req.user.id;

    // Call the database function to accept offer with conflict checking
    const { data, error } = await supabase.rpc("accept_job_offer", {
      offer_id_param: offer_id,
      worker_id_param: employee_id
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.success) {
      return res.status(400).json({ error: data.error });
    }

    // Get offer details for notification
    const { data: offerData } = await supabase
      .from("job_offers")
      .select(`
        *,
        job_postings (
          title,
          employer_id,
          scheduled_date,
          scheduled_start_time
        )
      `)
      .eq("id", offer_id)
      .single();

    // Notify employer
    if (offerData && offerData.job_postings) {
      const { data: worker } = await supabase
        .from("employees")
        .select("name")
        .eq("id", employee_id)
        .single();

      await createNotification(
        offerData.job_postings.employer_id,
        "EMPLOYER",
        "offer_accepted",
        "Worker Accepted Your Job Offer!",
        `${worker?.name || "A worker"} has accepted your offer for "${offerData.job_postings.title}"`,
        {
          offer_id: offer_id,
          job_id: offerData.job_posting_id,
          worker_id: employee_id
        }
      );
    }

    res.json({
      success: true,
      message: "Job offer accepted successfully",
      data: data
    });
  } catch (err) {
    console.error("Error accepting job offer:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 4. REJECT JOB OFFER --- */
exports.rejectJobOffer = async (req, res) => {
  try {
    const { offer_id } = req.params;
    const employee_id = req.user.id;
    const { reason } = req.body;

    // Call the database function to reject offer
    const { data, error } = await supabase.rpc("reject_job_offer", {
      offer_id_param: offer_id,
      worker_id_param: employee_id
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.success) {
      return res.status(400).json({ error: data.error });
    }

    res.json({
      success: true,
      message: "Job offer rejected"
    });
  } catch (err) {
    console.error("Error rejecting job offer:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 5. GET WORKER'S SCHEDULE (to see conflicts) --- */
exports.getWorkerSchedule = async (req, res) => {
  try {
    const employee_id = req.user.id;
    const { date } = req.query; // Format: YYYY-MM-DD

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const { data, error } = await supabase.rpc("get_worker_schedule_conflicts", {
      worker_id: employee_id,
      check_date: date
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      date: date,
      scheduled_jobs: data || []
    });
  } catch (err) {
    console.error("Error fetching worker schedule:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 6. CHECK WORKER AVAILABILITY --- */
exports.checkWorkerAvailability = async (req, res) => {
  try {
    const employee_id = req.user.id;
    const { start_time, end_time } = req.query;

    if (!start_time || !end_time) {
      return res.status(400).json({ 
        error: "start_time and end_time parameters are required" 
      });
    }

    const { data, error } = await supabase.rpc("is_worker_available", {
      worker_id: employee_id,
      start_time: start_time,
      end_time: end_time
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      is_available: data,
      start_time: start_time,
      end_time: end_time
    });
  } catch (err) {
    console.error("Error checking availability:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 7. GET JOB OFFER STATS FOR WORKER --- */
exports.getJobOfferStats = async (req, res) => {
  try {
    const employee_id = req.user.id;

    // Get counts by status
    const { data: stats, error } = await supabase
      .from("job_offers")
      .select("offer_status")
      .eq("employee_id", employee_id);

    if (error) return res.status(400).json({ error: error.message });

    const statsSummary = {
      total: stats?.length || 0,
      pending: stats?.filter(s => s.offer_status === "pending").length || 0,
      accepted: stats?.filter(s => s.offer_status === "accepted").length || 0,
      rejected: stats?.filter(s => s.offer_status === "rejected").length || 0,
      expired: stats?.filter(s => s.offer_status === "expired").length || 0
    };

    res.json(statsSummary);
  } catch (err) {
    console.error("Error fetching offer stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = exports;
