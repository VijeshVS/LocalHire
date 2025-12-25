const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { supabase } = require("../config/SupabaseClient.js");

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

/* --- 1. ADMIN AUTHENTICATION --- */
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data, error } = await supabase
      .from("admins")
      .insert({ id, name, email, phone, password_hash, role: role || "admin" })
      .select("-password_hash");

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: "Admin registered", data: data[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !admin) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

/* --- 2. JOB DOMAINS --- */
exports.addDomain = async (req, res) => {
  const { domain_name } = req.body;
  const { data, error } = await supabase
    .from("job_domains")
    .insert({ id: crypto.randomUUID(), domain_name })
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
};

exports.updateDomain = async (req, res) => {
  const { domain_name } = req.body;
  const { data, error } = await supabase
    .from("job_domains")
    .update({ domain_name })
    .eq("id", req.params.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
};

exports.deleteDomain = async (req, res) => {
  const { error } = await supabase.from("job_domains").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Domain and associated skills deleted" });
};

/* --- 3. SKILLS --- */
exports.addSkill = async (req, res) => {
  try {
    const { domain_id, skill_name, skills } = req.body;
    let skillsToInsert = [];

    if (Array.isArray(skills)) {
      skillsToInsert = skills.map(name => ({
        id: crypto.randomUUID(),
        domain_id,
        skill_name: name
      }));
    } else if (skill_name) {
      skillsToInsert = [{
        id: crypto.randomUUID(),
        domain_id,
        skill_name
      }];
    }

    if (skillsToInsert.length === 0) {
      return res.status(400).json({ error: "No skills provided" });
    }

    const { data, error } = await supabase
      .from("skills")
      .insert(skillsToInsert)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateSkill = async (req, res) => {
  const { skill_name } = req.body;
  const { data, error } = await supabase
    .from("skills")
    .update({ skill_name })
    .eq("id", req.params.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
};

exports.deleteSkill = async (req, res) => {
  const { error } = await supabase.from("skills").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Skill deleted" });
};

/* --- 4. DATA RETRIEVAL --- */
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