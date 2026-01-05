const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { supabase } = require("./config/SupabaseClient.js");

async function seedDatabase() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // ==================== 1. SEED SKILLS ====================
    console.log("📋 Seeding skills...");
    const skills = [
      { id: crypto.randomUUID(), skill_name: "Painting" },
      { id: crypto.randomUUID(), skill_name: "House Cleaning" },
      { id: crypto.randomUUID(), skill_name: "Office Cleaning" },
      { id: crypto.randomUUID(), skill_name: "Helper" },
      { id: crypto.randomUUID(), skill_name: "Moving" },
      { id: crypto.randomUUID(), skill_name: "Driving" },
      { id: crypto.randomUUID(), skill_name: "Cooking" },
      { id: crypto.randomUUID(), skill_name: "Gardening" },
      { id: crypto.randomUUID(), skill_name: "Plumbing" },
      { id: crypto.randomUUID(), skill_name: "Electrical Work" },
    ];

    const { data: skillsData, error: skillsError } = await supabase
      .from("skills")
      .upsert(skills, { onConflict: "skill_name" })
      .select();

    if (skillsError) {
      console.log("⚠️ Skills may already exist:", skillsError.message);
    } else {
      console.log(`✅ Inserted ${skillsData?.length || 0} skills`);
    }

    // Get existing skills for reference
    const { data: existingSkills } = await supabase
      .from("skills")
      .select("id, skill_name");
    
    const skillMap = {};
    existingSkills?.forEach(s => skillMap[s.skill_name] = s.id);

    // ==================== 2. SEED EMPLOYERS ====================
    console.log("\n👔 Seeding employers...");
    const employerPassword = await bcrypt.hash("password123", 10);
    
    const employers = [
      {
        id: crypto.randomUUID(),
        name: "Rajesh Kumar",
        email: "rajesh@example.com",
        phone: "9876543210",
        password_hash: employerPassword,
        business_name: "Home Solutions",
        business_type: "Home Services",
        language: "English",
        address: "Koramangala, Bangalore",
        location: "POINT(77.6245 12.9352)",
        verified: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "9876543211",
        password_hash: employerPassword,
        business_name: "Tech Park Services",
        business_type: "Corporate",
        language: "English",
        address: "Electronic City, Bangalore",
        location: "POINT(77.6689 12.8456)",
        verified: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Amit Patel",
        email: "amit@example.com",
        phone: "9876543212",
        password_hash: employerPassword,
        business_name: "Quick Fix Services",
        business_type: "Maintenance",
        language: "Hindi",
        address: "BTM Layout, Bangalore",
        location: "POINT(77.6099 12.9166)",
        verified: false,
      },
    ];

    const { data: employersData, error: employersError } = await supabase
      .from("employers")
      .upsert(employers, { onConflict: "email" })
      .select();

    if (employersError) {
      console.log("⚠️ Employers error:", employersError.message);
    } else {
      console.log(`✅ Inserted ${employersData?.length || 0} employers`);
    }

    // Get employer IDs
    const { data: existingEmployers } = await supabase
      .from("employers")
      .select("id, email");
    
    const employerMap = {};
    existingEmployers?.forEach(e => employerMap[e.email] = e.id);

    // ==================== 3. SEED WORKERS (EMPLOYEES) ====================
    console.log("\n👷 Seeding workers...");
    const workerPassword = await bcrypt.hash("password123", 10);

    const workers = [
      {
        id: crypto.randomUUID(),
        name: "Ravi Kumar",
        email: "ravi@example.com",
        phone: "9123456780",
        password_hash: workerPassword,
        language: "Kannada",
        user_type: "worker",
        years_of_experience: 3,
        address: "Jayanagar, Bangalore",
        location: "POINT(77.5838 12.9299)",
        status: "active",
        rating: 4.8,
      },
      {
        id: crypto.randomUUID(),
        name: "Sunita Devi",
        email: "sunita@example.com",
        phone: "9123456781",
        password_hash: workerPassword,
        language: "Hindi",
        user_type: "worker",
        years_of_experience: 2,
        address: "Indiranagar, Bangalore",
        location: "POINT(77.6408 12.9784)",
        status: "active",
        rating: 4.5,
      },
      {
        id: crypto.randomUUID(),
        name: "Suresh Yadav",
        email: "suresh@example.com",
        phone: "9123456782",
        password_hash: workerPassword,
        language: "Hindi",
        user_type: "worker",
        years_of_experience: 1,
        address: "Whitefield, Bangalore",
        location: "POINT(77.7480 12.9698)",
        status: "active",
        rating: 4.2,
      },
    ];

    const { data: workersData, error: workersError } = await supabase
      .from("employees")
      .upsert(workers, { onConflict: "email" })
      .select();

    if (workersError) {
      console.log("⚠️ Workers error:", workersError.message);
    } else {
      console.log(`✅ Inserted ${workersData?.length || 0} workers`);
    }

    // Get worker IDs
    const { data: existingWorkers } = await supabase
      .from("employees")
      .select("id, email");
    
    const workerMap = {};
    existingWorkers?.forEach(w => workerMap[w.email] = w.id);

    // ==================== 4. SEED WORKER SKILLS ====================
    console.log("\n🔧 Linking worker skills...");
    const workerSkills = [];
    
    if (workerMap["ravi@example.com"] && skillMap["Painting"]) {
      workerSkills.push({ employee_id: workerMap["ravi@example.com"], skill_id: skillMap["Painting"] });
      workerSkills.push({ employee_id: workerMap["ravi@example.com"], skill_id: skillMap["Helper"] });
    }
    if (workerMap["sunita@example.com"] && skillMap["House Cleaning"]) {
      workerSkills.push({ employee_id: workerMap["sunita@example.com"], skill_id: skillMap["House Cleaning"] });
      workerSkills.push({ employee_id: workerMap["sunita@example.com"], skill_id: skillMap["Office Cleaning"] });
    }
    if (workerMap["suresh@example.com"] && skillMap["Moving"]) {
      workerSkills.push({ employee_id: workerMap["suresh@example.com"], skill_id: skillMap["Moving"] });
      workerSkills.push({ employee_id: workerMap["suresh@example.com"], skill_id: skillMap["Helper"] });
    }

    if (workerSkills.length > 0) {
      const { error: wsError } = await supabase
        .from("employee_skills")
        .upsert(workerSkills, { onConflict: "employee_id,skill_id", ignoreDuplicates: true });

      if (wsError) {
        console.log("⚠️ Worker skills may already exist:", wsError.message);
      } else {
        console.log(`✅ Linked ${workerSkills.length} worker skills`);
      }
    }

    // ==================== 5. SEED JOB POSTINGS ====================
    console.log("\n📝 Seeding job postings...");
    const jobs = [];

    if (employerMap["rajesh@example.com"]) {
      jobs.push({
        id: crypto.randomUUID(),
        employer_id: employerMap["rajesh@example.com"],
        title: "Experienced House Painter",
        category: "Painting",
        description: "Need an experienced painter for interior wall painting. 3 rooms to be painted with premium emulsion paint. Color matching skills required.",
        wage: 800,
        duration: "9:00 AM - 6:00 PM",
        radius_km: 10,
        address: "Koramangala 4th Block, Bangalore",
        location: "POINT(77.6245 12.9352)",
        is_active: true,
      });
      jobs.push({
        id: crypto.randomUUID(),
        employer_id: employerMap["rajesh@example.com"],
        title: "Daily House Cleaning",
        category: "House Cleaning",
        description: "Looking for reliable house cleaning staff for a 3BHK apartment. Daily cleaning including mopping, dusting, and bathroom cleaning.",
        wage: 500,
        duration: "8:00 AM - 12:00 PM",
        radius_km: 5,
        address: "Koramangala 6th Block, Bangalore",
        location: "POINT(77.6200 12.9340)",
        is_active: true,
      });
    }

    if (employerMap["priya@example.com"]) {
      jobs.push({
        id: crypto.randomUUID(),
        employer_id: employerMap["priya@example.com"],
        title: "Office Cleaning Staff",
        category: "Office Cleaning",
        description: "Need office cleaning staff for a tech park. Work involves cleaning workstations, conference rooms, and common areas.",
        wage: 600,
        duration: "6:00 AM - 10:00 AM",
        radius_km: 15,
        address: "Electronic City Phase 1, Bangalore",
        location: "POINT(77.6689 12.8456)",
        is_active: true,
      });
    }

    if (employerMap["amit@example.com"]) {
      jobs.push({
        id: crypto.randomUUID(),
        employer_id: employerMap["amit@example.com"],
        title: "Moving Helper Needed",
        category: "Moving",
        description: "Need strong helpers for household shifting. Work involves packing, loading, and unloading furniture and boxes.",
        wage: 700,
        duration: "7:00 AM - 5:00 PM",
        radius_km: 20,
        address: "BTM Layout 2nd Stage, Bangalore",
        location: "POINT(77.6099 12.9166)",
        is_active: true,
      });
      jobs.push({
        id: crypto.randomUUID(),
        employer_id: employerMap["amit@example.com"],
        title: "General Helper",
        category: "Helper",
        description: "Need a general helper for various tasks including carrying materials, cleaning, and assisting technicians.",
        wage: 550,
        duration: "10:00 AM - 6:00 PM",
        radius_km: 10,
        address: "JP Nagar, Bangalore",
        location: "POINT(77.5854 12.9063)",
        is_active: true,
      });
    }

    const { data: jobsData, error: jobsError } = await supabase
      .from("job_postings")
      .upsert(jobs)
      .select();

    if (jobsError) {
      console.log("⚠️ Jobs error:", jobsError.message);
    } else {
      console.log(`✅ Inserted ${jobsData?.length || 0} job postings`);
    }

    // Get job IDs
    const { data: existingJobs } = await supabase
      .from("job_postings")
      .select("id, title");

    // ==================== 6. SEED JOB REQUIRED SKILLS ====================
    console.log("\n🎯 Linking job required skills...");
    const jobSkills = [];
    
    existingJobs?.forEach(job => {
      if (job.title.includes("Painter") && skillMap["Painting"]) {
        jobSkills.push({ job_posting_id: job.id, skill_id: skillMap["Painting"] });
      }
      if (job.title.includes("House Cleaning") && skillMap["House Cleaning"]) {
        jobSkills.push({ job_posting_id: job.id, skill_id: skillMap["House Cleaning"] });
      }
      if (job.title.includes("Office Cleaning") && skillMap["Office Cleaning"]) {
        jobSkills.push({ job_posting_id: job.id, skill_id: skillMap["Office Cleaning"] });
      }
      if (job.title.includes("Moving") && skillMap["Moving"]) {
        jobSkills.push({ job_posting_id: job.id, skill_id: skillMap["Moving"] });
      }
      if (job.title.includes("Helper") && skillMap["Helper"]) {
        jobSkills.push({ job_posting_id: job.id, skill_id: skillMap["Helper"] });
      }
    });

    if (jobSkills.length > 0) {
      const { error: jsError } = await supabase
        .from("job_required_skills")
        .upsert(jobSkills, { ignoreDuplicates: true });

      if (jsError) {
        console.log("⚠️ Job skills may already exist:", jsError.message);
      } else {
        console.log(`✅ Linked ${jobSkills.length} job required skills`);
      }
    }

    // ==================== 7. SEED JOB APPLICATIONS ====================
    console.log("\n📨 Seeding job applications...");
    const applications = [];

    if (existingJobs?.length > 0 && Object.keys(workerMap).length > 0) {
      // Ravi applies for painting job
      const paintingJob = existingJobs.find(j => j.title.includes("Painter"));
      if (paintingJob && workerMap["ravi@example.com"]) {
        applications.push({
          id: crypto.randomUUID(),
          job_posting_id: paintingJob.id,
          employee_id: workerMap["ravi@example.com"],
          status: "applied",
        });
      }

      // Sunita applies for cleaning jobs
      const cleaningJob = existingJobs.find(j => j.title.includes("House Cleaning"));
      if (cleaningJob && workerMap["sunita@example.com"]) {
        applications.push({
          id: crypto.randomUUID(),
          job_posting_id: cleaningJob.id,
          employee_id: workerMap["sunita@example.com"],
          status: "shortlisted",
        });
      }

      // Suresh applies for moving job
      const movingJob = existingJobs.find(j => j.title.includes("Moving"));
      if (movingJob && workerMap["suresh@example.com"]) {
        applications.push({
          id: crypto.randomUUID(),
          job_posting_id: movingJob.id,
          employee_id: workerMap["suresh@example.com"],
          status: "applied",
        });
      }
    }

    if (applications.length > 0) {
      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .upsert(applications, { ignoreDuplicates: true })
        .select();

      if (appsError) {
        console.log("⚠️ Applications error:", appsError.message);
      } else {
        console.log(`✅ Inserted ${appsData?.length || 0} job applications`);
      }
    }

    console.log("\n🎉 Database seeding completed!");
    console.log("\n📋 Test Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Workers (use on Worker login):");
    console.log("  Email: ravi@example.com    Password: password123");
    console.log("  Email: sunita@example.com  Password: password123");
    console.log("  Email: suresh@example.com  Password: password123");
    console.log("");
    console.log("Employers (use on Employer login):");
    console.log("  Email: rajesh@example.com  Password: password123");
    console.log("  Email: priya@example.com   Password: password123");
    console.log("  Email: amit@example.com    Password: password123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Seeding error:", error);
  }

  process.exit(0);
}

seedDatabase();
