const { supabase } = require("../config/SupabaseClient.js");

/* ---------------- FIND NEARBY EMPLOYEES ---------------- */
exports.findNearbyEmployeesWithSkills = async (req, res) => {
  try {
    const { latitude, longitude, radius_km = 10 } = req.query;

    const { data, error } = await supabase.rpc("get_employees_in_radius_with_skills", {
      lat: parseFloat(latitude),
      long: parseFloat(longitude),
      radius_meters: parseFloat(radius_km) * 1000
    });

    if (error) return res.status(400).json({ error: error.message });

    const formattedData = data.map(row => ({
      ...row.employee_data,
      distance_km: parseFloat((row.dist_meters / 1000).toFixed(2))
    }));

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ---------------- FIND NEARBY JOBS ---------------- */
exports.findNearbyJobs = async (req, res) => {
  try {
    const { latitude, longitude, radius_km = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const { data, error } = await supabase.rpc("get_jobs_in_radius", {
      lat: parseFloat(latitude),
      long: parseFloat(longitude),
      radius_meters: parseFloat(radius_km) * 1000
    });

    if (error) return res.status(400).json({ error: error.message });

    const formattedData = data.map(job => {
      const { dist_meters, ...jobData } = job;
      return {
        ...jobData,
        dist_km: parseFloat((dist_meters / 1000).toFixed(2))
      };
    });

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};