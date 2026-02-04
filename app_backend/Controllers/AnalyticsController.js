const { supabase } = require("../config/SupabaseClient.js");

/* --- EMPLOYER ANALYTICS --- */
exports.getEmployerAnalytics = async (req, res) => {
  try {
    const employerId = req.user.id;

    // Get all jobs posted by employer
    const { data: jobs, error: jobsError } = await supabase
      .from("job_postings")
      .select("id, wage, is_active, created_at")
      .eq("employer_id", employerId);

    if (jobsError) {
      console.error("Jobs query error:", jobsError);
      throw jobsError;
    }

    // Get all applications for employer's jobs
    const jobIds = jobs.map(j => j.id);
    
    // If no jobs, return empty stats
    if (jobIds.length === 0) {
      return res.json({
        overview: {
          totalJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          totalSpent: 0,
          totalApplications: 0,
          totalHires: 0,
          completedHires: 0,
          inProgressHires: 0,
          avgJobCompletion: 0,
        },
        applications: {
          total: 0,
          accepted: 0,
          shortlisted: 0,
          rejected: 0,
          pending: 0,
          completed: 0,
          inProgress: 0,
        },
        monthlyStats: [],
      });
    }
    
    const { data: applications, error: appsError } = await supabase
      .from("job_applications")
      .select("id, status, work_status, job_posting_id, completed_at")
      .in("job_posting_id", jobIds);

    if (appsError) {
      console.error("Applications query error:", appsError);
      throw appsError;
    }

    // Ensure applications is an array
    const safeApplications = applications || [];

    // Calculate stats
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.is_active).length;
    
    // A job is completed if it has at least one completed application
    const completedJobs = jobIds.filter(jobId => 
      safeApplications.some(a => a.job_posting_id === jobId && a.work_status === 'completed')
    ).length;
    
    const totalSpent = jobs.reduce((sum, j) => sum + (parseFloat(j.wage) || 0), 0);
    
    const totalApplications = safeApplications.length;
    const acceptedApplications = safeApplications.filter(a => a.status === 'accepted').length;
    const shortlistedApplications = safeApplications.filter(a => a.status === 'shortlisted').length;
    const rejectedApplications = safeApplications.filter(a => a.status === 'rejected').length;
    const pendingApplications = safeApplications.filter(a => a.status === 'applied').length;
    const completedApplications = safeApplications.filter(a => a.work_status === 'completed').length;
    const inProgressApplications = safeApplications.filter(a => a.work_status === 'in_progress').length;

    // Get monthly job posting stats
    const monthlyStats = getMonthlyStats(jobs, safeApplications);

    res.json({
      overview: {
        totalJobs,
        activeJobs,
        completedJobs,
        totalSpent: Math.round(totalSpent),
        totalApplications,
        totalHires: acceptedApplications,
        completedHires: completedApplications,
        inProgressHires: inProgressApplications,
        avgJobCompletion: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
      },
      applications: {
        total: totalApplications,
        accepted: acceptedApplications,
        shortlisted: shortlistedApplications,
        rejected: rejectedApplications,
        pending: pendingApplications,
        completed: completedApplications,
        inProgress: inProgressApplications,
      },
      monthlyStats,
    });
  } catch (err) {
    console.error("Error fetching employer analytics:", err);
    console.error("Error details:", err.message, err.stack);
    res.status(500).json({ 
      error: "Internal server error",
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/* --- WORKER ANALYTICS --- */
exports.getWorkerAnalytics = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // Get all applications by worker
    const { data: applications, error: appsError } = await supabase
      .from("job_applications")
      .select(`
        id,
        status,
        work_status,
        applied_at,
        completed_at,
        job_postings (
          wage
        )
      `)
      .eq("employee_id", employeeId);

    if (appsError) throw appsError;

    // Calculate stats
    const totalApplications = applications.length;
    const acceptedJobs = applications.filter(a => a.status === 'accepted');
    const completedJobs = applications.filter(a => a.work_status === 'completed');
    const inProgressJobs = applications.filter(a => a.work_status === 'in_progress');
    const rejectedApplications = applications.filter(a => a.status === 'rejected').length;
    const pendingApplications = applications.filter(a => a.status === 'applied').length;
    const shortlistedApplications = applications.filter(a => a.status === 'shortlisted').length;

    // Calculate earnings (sum of completed job wages)
    const totalEarnings = completedJobs.reduce((sum, app) => {
      return sum + (parseFloat(app.job_postings?.wage) || 0);
    }, 0);

    // Get monthly application stats
    const monthlyStats = getMonthlyApplicationStats(applications);

    // Calculate completion rate (completed / accepted)
    const completionRate = acceptedJobs.length > 0 
      ? Math.round((completedJobs.length / acceptedJobs.length) * 100) 
      : 0;

    res.json({
      overview: {
        totalApplications,
        acceptedJobs: acceptedJobs.length,
        completedJobs: completedJobs.length,
        inProgressJobs: inProgressJobs.length,
        rejectedApplications,
        pendingApplications,
        shortlistedApplications,
        totalEarnings: Math.round(totalEarnings),
        completionRate,
      },
      monthlyStats,
    });
  } catch (err) {
    console.error("Error fetching worker analytics:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- HELPER FUNCTIONS --- */
function getMonthlyStats(jobs, applications) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const stats = [];

  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    const monthJobs = jobs.filter(j => {
      const jobDate = new Date(j.created_at);
      return jobDate.getMonth() === date.getMonth() && 
             jobDate.getFullYear() === date.getFullYear();
    });

    const spent = monthJobs.reduce((sum, j) => sum + (parseFloat(j.wage) || 0), 0);
    
    // Count completed applications for this month's jobs
    const jobIds = monthJobs.map(j => j.id);
    const completed = applications.filter(a => 
      jobIds.includes(a.job_posting_id) && a.work_status === 'completed'
    ).length;

    stats.push({
      month,
      year,
      jobs: monthJobs.length,
      spent: Math.round(spent),
      completed,
    });
  }

  return stats;
}

function getMonthlyApplicationStats(applications) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const stats = [];

  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    const monthApps = applications.filter(a => {
      const appDate = new Date(a.applied_at);
      return appDate.getMonth() === date.getMonth() && 
             appDate.getFullYear() === date.getFullYear();
    });

    const accepted = monthApps.filter(a => a.status === 'accepted').length;
    const completed = monthApps.filter(a => a.work_status === 'completed').length;
    const earnings = monthApps
      .filter(a => a.work_status === 'completed')
      .reduce((sum, a) => sum + (parseFloat(a.job_postings?.wage) || 0), 0);

    stats.push({
      month,
      year,
      applications: monthApps.length,
      accepted,
      completed,
      earnings: Math.round(earnings),
    });
  }

  return stats;
}
