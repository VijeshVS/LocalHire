const { supabase } = require("../config/SupabaseClient.js");

/* --- SKILLS & JOB DOMAINS RETRIEVAL --- */
exports.getDomains = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_domains")
      .select("*")
      .order("domain_name", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getSkillsByDomain = async (req, res) => {
  try {
    const { domain_id } = req.params;
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .eq("domain_id", domain_id)
      .order("skill_name", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllDomainsWithSkills = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_domains")
      .select(`
        id,
        domain_name,
        skills (
          id,
          skill_name
        )
      `);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};