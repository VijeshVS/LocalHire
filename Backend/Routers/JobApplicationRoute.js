const express = require("express");
const router = express.Router();
const employeeAppController = require("../Controllers/JobApplicationController.js");
const { verifyEmployee } = require("../Middleware/Authentication.js");

// Apply middleware to all routes in this file
router.use(verifyEmployee);

// POST: Apply for a job
router.post("/apply", employeeAppController.applyForJob);

// GET: All applications for the logged-in employee
router.get("/my-applications", employeeAppController.getMyApplications);

// GET: Details of a specific application
router.get("/application/:id", employeeAppController.getApplicationById);

// DELETE: Withdraw an application
router.delete("/withdraw/:application_id", employeeAppController.withdrawApplication);

module.exports = router;