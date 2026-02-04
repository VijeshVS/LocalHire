const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { supabase } = require("../config/SupabaseClient.js");

const JWT_SECRET = process.env.JWT_SECRET;

/* ---------------- REGISTER EMPLOYEE ---------------- */
exports.registerEmployee = async (req, res) => {
  try {
    const { 
      name, email, phone, password, 
      language, user_type, years_of_experience, 
      address, location,
      skill_ids,       // Array of UUIDs for existing skills
      requested_skills // Array of Strings for new skill suggestions
    } = req.body;

    const password_hash = await bcrypt.hash(password, 10);
    const employee_id = crypto.randomUUID();
    const pointString = location ? `POINT(${location.longitude} ${location.latitude})` : null;

    // STEP 1: Insert the Employee
    const { data: employeeData, error: empError } = await supabase
      .from("employees")
      .insert({
        id: employee_id, name, email, phone, password_hash,
        language, user_type, years_of_experience,
        address, location: pointString, status: "active"
      })
      .select()
      .single();

    if (empError) return res.status(400).json({ error: empError.message });

    // STEP 2: Link Existing Skills (UUIDs)
    if (skill_ids && Array.isArray(skill_ids) && skill_ids.length > 0) {
      const skillLinks = skill_ids.map(skill_id => ({
        employee_id: employee_id,
        skill_id: skill_id
      }));

      const { error: skillError } = await supabase
        .from("employee_skills")
        .insert(skillLinks);

      // Note: We don't necessarily want to crash the whole registration 
      // if skill linking fails, but we log it.
      if (skillError) console.error("Link skills error:", skillError.message);
    }

    // STEP 3: Save New Requested Skills (Strings)
    if (requested_skills && Array.isArray(requested_skills) && requested_skills.length > 0) {
      const requestsToInsert = requested_skills.map(skillName => ({
        employee_id: employee_id,
        skill_name: skillName,
        status: 'pending'
      }));

      const { error: requestError } = await supabase
        .from("skills_requested")
        .insert(requestsToInsert);

      if (requestError) console.error("Requested skills error:", requestError.message);
    }

    res.json({ 
      message: "Employee registered successfully. Skill requests submitted for admin review.", 
      employee: employeeData 
    });

  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ---------------- LOGIN EMPLOYEE ---------------- */
exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: employee, error } = await supabase
      .from("employees")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !employee) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, employee.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: employee.id, role: "EMPLOYEE" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: "EMPLOYEE"
      }
    });
  } catch (err) {
    console.error("EMPLOYEE LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ---------------- EMPLOYEE PROFILE ---------------- */
exports.getEmployeeProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch employee details AND their linked skills AND busy status
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id, name, email, phone, years_of_experience, address, language, rating, status, user_type, created_at,
        busy_until, current_job_id,
        employee_skills (
          skills (
            id,
            skill_name
          )
        )
      `)
      .eq("id", decoded.id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Employee not found" });

    // Flatten the skills array for a cleaner API response
    const formattedData = {
      ...data,
      skills: data.employee_skills.map(item => item.skills),
      is_busy: data.busy_until ? new Date(data.busy_until) > new Date() : false
    };

    // Remove the nested original key to keep it clean
    delete formattedData.employee_skills;

    res.json(formattedData);
  } catch (err) {
    res.status(401).json({ error: "Unauthorized or invalid token" });
  }
};

/* ---------------- UPDATE EMPLOYEE PROFILE ---------------- */
exports.updateEmployeeProfile = async (req, res) => {
  try {
    // 1. Authenticate the User via Token
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Destructure fields allowed for update
    const { 
      name, 
      phone, 
      language, 
      years_of_experience, 
      address, 
      location, 
      user_type 
    } = req.body;

    // 3. Build a dynamic update object
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (language) updateData.language = language;
    if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience;
    if (address) updateData.address = address;
    if (user_type) updateData.user_type = user_type;

    // Handle Location update for PostGIS (GEOGRAPHY)
    if (location && location.longitude && location.latitude) {
      updateData.location = `POINT(${location.longitude} ${location.latitude})`;
    }

    // 4. Execute Update in Supabase
    const { data, error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", decoded.id) 
      .select()
      .single();

    if (error) {
      console.error("UPDATE ERROR:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Employee profile updated successfully", data });

  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

/* ---------------- ADD SKILL TO EMPLOYEE ---------------- */
exports.addEmployeeSkill = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { skill_id } = req.body;

    if (!skill_id) {
      return res.status(400).json({ error: "skill_id is required" });
    }

    // Insert into the junction table
    const { data, error } = await supabase
      .from("employee_skills")
      .insert({
        employee_id: decoded.id,
        skill_id: skill_id
      })
      .select();

    if (error) {
      // Handle unique constraint violation (skill already added)
      if (error.code === '23505') {
        return res.status(400).json({ error: "Skill already added to profile" });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Skill added successfully", data });

  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

/* ---------------- REMOVE SKILL FROM EMPLOYEE ---------------- */
exports.removeEmployeeSkill = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { skill_id } = req.params; // Using params for DELETE is standard practice

    const { error } = await supabase
      .from("employee_skills")
      .delete()
      .match({ 
        employee_id: decoded.id, 
        skill_id: skill_id 
      });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Skill removed successfully" });

  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
