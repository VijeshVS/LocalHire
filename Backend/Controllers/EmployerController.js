const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { supabase } = require("../config/SupabaseClient.js");

const JWT_SECRET = process.env.JWT_SECRET;

/* ---------------- REGISTER EMPLOYER ---------------- */
exports.registerEmployer = async (req, res) => {
  try {
    console.log("--- START EMPLOYER REGISTER ---");
    
    // 1. Destructure all fields including location and address
    const {
      name,
      email,
      phone,
      password,
      business_name,
      business_type,
      language,
      location, // Expected format: { latitude: 12.9, longitude: 77.5 }
      address
    } = req.body;

    // 2. Hash password and generate UUID
    const password_hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    // 3. Format location for GEOGRAPHY(Point, 4326)
    const pointString = location 
      ? `POINT(${location.longitude} ${location.latitude})` 
      : null;

    // 4. Insert into Supabase
    const { data, error } = await supabase
      .from("employers")
      .insert({
        id,
        name,
        email,
        phone,
        password_hash,
        business_name,
        business_type,
        language,
        address,
        location: pointString, 
        verified: false        
      })
      .select();

    if (error) {
      console.error("SUPABASE EMPLOYER ERROR:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("Employer registered successfully");
    res.json({ message: "Employer registered successfully", data });

  } catch (err) {
    console.error("EMPLOYER REGISTER CATCH:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ---------------- LOGIN EMPLOYER ---------------- */
exports.loginEmployer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: employer, error } = await supabase
      .from("employers")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !employer) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, employer.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: employer.id, role: "EMPLOYER" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      token,
      user: {
        id: employer.id,
        name: employer.name,
        email: employer.email,
        role: "EMPLOYER"
      }
    });
  } catch (err) {
    console.error("EMPLOYER LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ---------------- EMPLOYER PROFILE ---------------- */
exports.getEmployerProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data } = await supabase
      .from("employers")
      .select("id,name,email,phone,business_name,business_type,verified,address,language,created_at")
      .eq("id", decoded.id)
      .single();

    res.json(data);
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

/* ---------------- UPDATE EMPLOYER PROFILE ---------------- */
exports.updateEmployerProfile = async (req, res) => {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Destructure fields the user is allowed to update
    const { 
      name, 
      phone, 
      business_name, 
      business_type, 
      language, 
      address, 
      location 
    } = req.body;

    // 3. Prepare the update object
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (business_name) updateData.business_name = business_name;
    if (business_type) updateData.business_type = business_type;
    if (language) updateData.language = language;
    if (address) updateData.address = address;
    
    // Format location if provided
    if (location) {
      updateData.location = `POINT(${location.longitude} ${location.latitude})`;
    }

    // 4. Update in Supabase where ID matches the token ID
    const { data, error } = await supabase
      .from("employers")
      .update(updateData)
      .eq("id", decoded.id) 
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Profile updated successfully", data });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(401).json({ error: "Unauthorized or Invalid Token" });
  }
};