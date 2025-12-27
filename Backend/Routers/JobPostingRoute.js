const express = require("express");
const router = express.Router();
const jobController = require("../Controllers/JobPostingController.js");
const { verifyToken } = require("../Middleware/Authentication.js");

/* --- 1. JOB POSTING MANAGEMENT --- */

// Get all jobs for the logged-in employer
router.get("/myjobs", verifyToken, jobController.getMyJobs);

// Create a new job posting (including initial skill_ids)
router.post("/create", verifyToken, jobController.createJob);

// Update general job details (excludes skill modification)
router.put("/update/:id", verifyToken, jobController.updateJob);

// Delete a job posting
router.delete("/delete/:id", verifyToken, jobController.deleteJob);


/* --- 2. JOB SKILLS MANAGEMENT (NEW) --- */

// Add a single skill to an existing job
// Expected Body: { "skill_id": "UUID" }
router.post("/:id/skills", verifyToken, jobController.addSkillToJob);

// Remove a single skill from an existing job
// Expected Body: { "skill_id": "UUID" }
router.delete("/:id/skills", verifyToken, jobController.removeSkillFromJob);


/* --- 3. RETRIEVAL --- */

// Get a single job by ID (placed last to avoid route conflicts)
router.get("/:id", verifyToken, jobController.getJobById);

module.exports = router;