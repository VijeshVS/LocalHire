const { supabase } = require("../config/SupabaseClient.js");

/* --- SKILLS & REQUESTED SKILLS RETRIEVAL--- */
// Get all verified skills from the master table
exports.getAllSkills = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("skills")
      .select("id, skill_name")
      .order("skill_name", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get all skills requested by employees (Admin view)
exports.getAllRequestedSkills = async (req, res) => {
  try {
    // We join with employees to see who requested what
    const { data, error } = await supabase
      .from("skills_requested")
      .select(`
        id,
        skill_name,
        status,
        admin_notes,
        requested_at,
        employees (
          id,
          name,
          email
        )
      `)
      .order("requested_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};