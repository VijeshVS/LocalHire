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

    // Flatten the response so the employee details and distance are at the same level
    const formattedData = data.map(row => ({
      ...row.employee_data,
      distance_km: (row.dist_meters / 1000).toFixed(2)
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

    if (error) {
      console.error("RPC Error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Transform the result to convert meters to km
    const formattedData = data.map(job => {
      // 1. Calculate the km value from the DB's dist_meters
      const kmValue = job.dist_meters / 1000;
      
      // 2. Remove the meters property and add the km property
      const { dist_meters, ...jobWithoutMeters } = job;
      
      return {
        ...jobWithoutMeters,
        dist_km: parseFloat(kmValue.toFixed(2)) // Round to 2 decimal places
      };
    });

    res.json(formattedData);

  } catch (err) {
    console.error("Internal Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};