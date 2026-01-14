
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

/* --- 1. CORE SKILLS MANAGEMENT --- */

// Add a new skill directly (Admin use)
exports.addSkill = async (req, res) => {
  try {
    const { skill_name, skills } = req.body;
    let skillsToInsert = [];

    // Handle both single string or array of strings
    const skillList = Array.isArray(skills) ? skills : (skill_name ? [skill_name] : []);

    if (skillList.length === 0) {
      return res.status(400).json({ error: "No skills provided" });
    }

    skillsToInsert = skillList.map(name => ({
      id: crypto.randomUUID(),
      skill_name: name
    }));

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

/* --- 2. SKILLS REQUESTED (ADMIN WORKFLOW) --- */

exports.reviewSkillRequest = async (req, res) => {
  try {
    const { id } = req.params; // ID of the request (from skills_requested table)
    const { action, admin_notes } = req.body; // action: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'approved' or 'rejected'." });
    }

    // 1. Fetch the request details to get the skill name and the employee who asked
    const { data: request, error: fetchError } = await supabase
      .from("skills_requested")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !request) return res.status(404).json({ error: "Request not found" });

    if (action === 'approved') {
      const newSkillId = crypto.randomUUID();

      // 2. Add to master skills table
      const { data: newSkill, error: insertError } = await supabase
        .from("skills")
        .insert([{ id: newSkillId, skill_name: request.skill_name }])
        .select()
        .single();

      // If skill already exists (error 23505), we should find the existing skill's ID
      let finalSkillId = newSkillId;
      
      if (insertError) {
        if (insertError.code === '23505') {
          const { data: existingSkill } = await supabase
            .from("skills")
            .select("id")
            .eq("skill_name", request.skill_name)
            .single();
          finalSkillId = existingSkill.id;
        } else {
          return res.status(400).json({ error: insertError.message });
        }
      }

      // 3. Link the skill to the employee who requested it
      const { error: linkError } = await supabase
        .from("employee_skills")
        .insert([{ 
          employee_id: request.employee_id, 
          skill_id: finalSkillId 
        }]);

      if (linkError && linkError.code !== '23505') { // Ignore if link already exists
        return res.status(400).json({ error: "Skill approved but failed to link to employee: " + linkError.message });
      }
    }

    // 4. Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from("skills_requested")
      .update({ 
        status: action, 
        admin_notes: admin_notes || null,
        reviewed_at: new Date()
      })
      .eq("id", id)
      .select();

    if (updateError) return res.status(400).json({ error: updateError.message });

    res.json({ 
      message: `Skill ${action} and linked to employee successfully`, 
      data: updatedRequest[0] 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

