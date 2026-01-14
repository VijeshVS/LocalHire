const express = require("express");
const router = express.Router();
const applicationController = require("../Controllers/EmployerJobApplnController.js");
const { verifyEmployer } = require("../Middleware/Authentication.js");

// All routes here require employer authentication
router.use(verifyEmployer);

// Get applications for a specific job
router.get("/:job_id/applications", applicationController.getJobApplications);

// Update status of a specific application
router.put("/applications/:application_id/status", applicationController.updateApplicationStatus);

module.exports = router;