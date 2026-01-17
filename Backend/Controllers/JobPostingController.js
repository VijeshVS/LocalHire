const crypto = require("crypto");
const { supabase } = require("../config/SupabaseClient.js");

/* 1. CREATE JOB POSTING */
exports.createJob = async (req, res) => {
  try {
    const { title, category, description, wage, duration, radius_km, location, address, skill_ids, scheduled_date, scheduled_start_time, scheduled_end_time, duration_hours } = req.body;
    const employer_id = req.user.id;
    const id = crypto.randomUUID();

    console.log("Creating job for employer:", employer_id);

    // Validate required fields
    if (!title || !category || !description || !wage || !duration) {
      return res.status(400).json({ error: "Missing required fields: title, category, description, wage, duration" });
    }

    // Verify employer exists in database
    const { data: employerExists, error: employerError } = await supabase
      .from("employers")
      .select("id")
      .eq("id", employer_id)
      .single();

    if (employerError || !employerExists) {
      console.error("Employer verification failed:", employerError);
      return res.status(400).json({ error: "Employer account not found. Please login again." });
    }

    const pointString = location 
      ? `POINT(${location.longitude} ${location.latitude})` 
      : null;

    // 1. Insert the Job Posting (with is_active = true by default)
    const jobInsertData = {
      id, 
      employer_id, 
      title, 
      category, 
      description, 
      wage, 
      duration, 
      radius_km, 
      address, 
      location: pointString, 
      is_active: true
    };

    // Add scheduling fields if provided
    if (scheduled_date) jobInsertData.scheduled_date = scheduled_date;
    if (scheduled_start_time) jobInsertData.scheduled_start_time = scheduled_start_time;
    if (scheduled_end_time) jobInsertData.scheduled_end_time = scheduled_end_time;
    if (duration_hours) jobInsertData.duration_hours = duration_hours;

    const { data: jobData, error: jobError } = await supabase
      .from("job_postings")
      .insert(jobInsertData)
      .select()
      .single();

    if (jobError) {
      console.error("Job creation error:", jobError);
      return res.status(400).json({ error: jobError.message });
    }

    // 2. Insert Skills (using IDs) if provided
    if (skill_ids && Array.isArray(skill_ids) && skill_ids.length > 0) {
      const skillsToInsert = skill_ids.map(sid => ({
        job_posting_id: id,
        skill_id: sid // Now using skill_id reference
      }));

      const { error: skillError } = await supabase
        .from("job_required_skills")
        .insert(skillsToInsert);

      if (skillError) {
        // Rollback job creation if skills fail
        await supabase.from("job_postings").delete().eq("id", id);
        return res.status(400).json({ error: "Failed to add skills: " + skillError.message });
      }
    }

    console.log("Job created successfully:", id);
    res.status(201).json({ ...jobData, skill_ids: skill_ids || [] });
  } catch (err) {
    console.error("Create job error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 2. GET ALL JOBS OF EMPLOYER */
exports.getMyJobs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        *,
        job_required_skills (
          skills (id, skill_name)
        )
      `)
      .eq("employer_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const formattedData = data.map(job => {
      const skills = job.job_required_skills.map(s => s.skills);
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
    const { id } = req.params;

    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        *,
        job_required_skills (
          skills (
            id,
            skill_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Transform the data to return a flat 'skills' array
    // data.job_required_skills looks like: [{ skills: { id, skill_name } }, ...]
    const formattedSkills = data.job_required_skills
      .map(item => item.skills)
      .filter(skill => skill !== null); // Safety check

    // Construct the final response object
    const { job_required_skills, ...rest } = data;
    const formattedJob = { 
      ...rest, 
      skills: formattedSkills 
    };

    res.json(formattedJob);
  } catch (err) {
    console.error("GetJobById Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 3. UPDATE JOB DETAILS (Excludes Skills) */
exports.updateJob = async (req, res) => {
  try {
    const { title, category, description, wage, duration, radius_km, is_active, location, address } = req.body;
    const jobId = req.params.id;
    const employer_id = req.user.id;

    const updateData = { title, category, description, wage, duration, radius_km, is_active, address };
    if (location) updateData.location = `POINT(${location.longitude} ${location.latitude})`;

    const { data, error } = await supabase
      .from("job_postings")
      .update(updateData)
      .eq("id", jobId)
      .eq("employer_id", employer_id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 4. ADD A SKILL TO A JOB */
exports.addSkillToJob = async (req, res) => {
  try {
    const { skill_id } = req.body;
    const { id: job_posting_id } = req.params;

    const { error } = await supabase
      .from("job_required_skills")
      .insert({ job_posting_id, skill_id });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Skill added to job" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

/* 5. REMOVE A SKILL FROM A JOB */
exports.removeSkillFromJob = async (req, res) => {
  try {
    const { skill_id } = req.body;
    const { id: job_posting_id } = req.params;

    const { error } = await supabase
      .from("job_required_skills")
      .delete()
      .eq("job_posting_id", job_posting_id)
      .eq("skill_id", skill_id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Skill removed from job" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

/* 6. DELETE JOB POSTING */
exports.deleteJob = async (req, res) => {
  try {
    const { error } = await supabase
      .from("job_postings")
      .delete()
      .eq("id", req.params.id)
      .eq("employer_id", req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 7. GET ALL ACTIVE JOBS (For Workers) */
exports.getAllActiveJobs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        *,
        job_required_skills (
          skills (id, skill_name)
        )
      `)
      .or('is_active.eq.true,is_active.is.null')
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const formattedData = data.map(job => {
      const skills = job.job_required_skills?.map(s => s.skills) || [];
      const { job_required_skills, ...rest } = job;
      return { ...rest, skills };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Get all jobs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 8. SEARCH JOBS (For Workers) */
exports.searchJobs = async (req, res) => {
  try {
    const { query, category } = req.query;
    
    let dbQuery = supabase
      .from("job_postings")
      .select(`
        *,
        job_required_skills (
          skills (id, skill_name)
        )
      `)
      .or('is_active.eq.true,is_active.is.null');

    // Filter by category if provided
    if (category && category !== 'all') {
      dbQuery = dbQuery.eq("category", category);
    }

    // Search by title if query provided
    if (query) {
      dbQuery = dbQuery.ilike("title", `%${query}%`);
    }

    const { data, error } = await dbQuery.order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const formattedData = data.map(job => {
      const skills = job.job_required_skills?.map(s => s.skills) || [];
      const { job_required_skills, ...rest } = job;
      return { ...rest, skills };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Search jobs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};