const express = require("express");
const router = express.Router();
const jobController = require("../Controllers/JobPostingController.js");
const { verifyToken, verifyEmployer } = require("../Middleware/Authentication.js");

/* --- 1. JOB POSTING MANAGEMENT (Employer Only) --- */

// Get all jobs for the logged-in employer
router.get("/myjobs", verifyEmployer, jobController.getMyJobs);

// Create a new job posting (including initial skill_ids)
router.post("/create", verifyEmployer, jobController.createJob);

// Update general job details (excludes skill modification)
router.put("/update/:id", verifyEmployer, jobController.updateJob);

// Delete a job posting
router.delete("/delete/:id", verifyEmployer, jobController.deleteJob);


/* --- 2. JOB SKILLS MANAGEMENT (Employer Only) --- */

// Add a single skill to an existing job
// Expected Body: { "skill_id": "UUID" }
router.post("/:id/skills", verifyEmployer, jobController.addSkillToJob);

// Remove a single skill from an existing job
// Expected Body: { "skill_id": "UUID" }
router.delete("/:id/skills", verifyEmployer, jobController.removeSkillFromJob);


/* --- 3. RETRIEVAL (Any authenticated user) --- */

// Get all active jobs (for workers to browse)
router.get("/all", verifyToken, jobController.getAllActiveJobs);

// Search jobs by title/category
router.get("/search", verifyToken, jobController.searchJobs);

// Get a single job by ID (placed last to avoid route conflicts)
router.get("/:id", verifyToken, jobController.getJobById);

module.exports = router;