const crypto = require("crypto");
const { supabase } = require("../config/SupabaseClient.js");

/* 1. CREATE JOB POSTING */
exports.createJob = async (req, res) => {
  try {
    const { title, category, description, wage, duration, radius_km, location, address, skills } = req.body;
    const employer_id = req.user.id;
    const id = crypto.randomUUID();

    const pointString = location 
      ? `POINT(${location.longitude} ${location.latitude})` 
      : null;

    // 1. Insert the Job Posting
    const { data: jobData, error: jobError } = await supabase
      .from("job_postings")
      .insert({
        id, employer_id, title, category, description, wage, duration, radius_km, address, location: pointString
      })
      .select()
      .single();

    if (jobError) return res.status(400).json({ error: jobError.message });

    // 2. Insert Skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const skillsToInsert = skills.map(skill => ({
        job_posting_id: id,
        skill_name: skill
      }));

      const { error: skillError } = await supabase
        .from("job_required_skills")
        .insert(skillsToInsert);

      if (skillError) {
        // Optional: Delete the job if skill insertion fails (manual rollback)
        await supabase.from("job_postings").delete().eq("id", id);
        return res.status(400).json({ error: "Failed to add skills: " + skillError.message });
      }
    }

    res.status(201).json({ ...jobData, skills: skills || [] });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* GET ALL JOBS OF LOGGED-IN EMPLOYER */
exports.getMyJobs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        *,
        job_required_skills (skill_name)
      `)
      .eq("employer_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    // Transform the data to match your desired structure
    const formattedData = data.map(job => {
      const skills = job.job_required_skills.map(s => s.skill_name);
      // Remove the original relation key and add the flat 'skills' array
      const { job_required_skills, ...rest } = job;
      return { ...rest, skills };
    });

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* GET SINGLE JOB BY ID */
exports.getJobById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        *,
        job_required_skills (skill_name)
      `)
      .eq("id", req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Job not found" });

    // Transform the single object
    const skills = data.job_required_skills.map(s => s.skill_name);
    const { job_required_skills, ...rest } = data;
    
    const formattedJob = { ...rest, skills };

    res.json(formattedJob);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 4. UPDATE JOB POSTING */
exports.updateJob = async (req, res) => {
  try {
    const { title, category, description, wage, duration, radius_km, is_active, location, address, skills } = req.body;
    const jobId = req.params.id;
    const employer_id = req.user.id;

    const updateData = { title, category, description, wage, duration, radius_km, is_active, address };
    
    if (location) {
      updateData.location = `POINT(${location.longitude} ${location.latitude})`;
    }

    // 1. Update Job Details
    const { data: updateResult, error: jobError } = await supabase
      .from("job_postings")
      .update(updateData)
      .eq("id", jobId)
      .eq("employer_id", employer_id)
      .select();

    if (jobError) return res.status(400).json({ error: jobError.message });
    
    // 2. Sync Skills (Only if skills are provided in the request)
    if (skills && Array.isArray(skills)) {
      // Clear old skills
      await supabase.from("job_required_skills").delete().eq("job_posting_id", jobId);

      // Insert new skills if array is not empty
      if (skills.length > 0) {
        const skillsToInsert = skills.map(skill => ({
          job_posting_id: jobId,
          skill_name: skill
        }));
        await supabase.from("job_required_skills").insert(skillsToInsert);
      }
    }

    // 3. Fetch Fresh Data (Matches getJobById format)
    const { data, error: fetchError } = await supabase
      .from("job_postings")
      .select(`
        *,
        job_required_skills (skill_name)
      `)
      .eq("id", jobId)
      .single();

    if (fetchError || !data) {
      return res.status(404).json({ error: "Job data could not be retrieved" });
    }

    // 4. Format and Send Response
    const formattedSkills = data.job_required_skills.map(s => s.skill_name);
    const { job_required_skills, ...rest } = data;
    
    res.json({ ...rest, skills: formattedSkills });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 5. DELETE JOB POSTING */
exports.deleteJob = async (req, res) => {
  try {
    const { error } = await supabase
      .from("job_postings")
      .delete()
      .eq("id", req.params.id)
      .eq("employer_id", req.user.id); // Critical security check

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};