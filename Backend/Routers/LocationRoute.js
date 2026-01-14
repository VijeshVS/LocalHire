const express = require("express");
const router = express.Router();
const locationController = require("../Controllers/LocationController.js");
const { verifyToken } = require("../Middleware/Authentication.js");

// All routes require authentication
router.use(verifyToken);

// Route to search employees nearby (for employers)
// URL: /api/location/employees?latitude=12.97&longitude=77.59&radius_km=5
router.get("/employees", locationController.findNearbyEmployeesWithSkills);

// Route to search jobs nearby (for workers)
// URL: /api/location/jobs?latitude=12.97&longitude=77.59&radius_km=5
router.get("/jobs", locationController.findNearbyJobs);

module.exports = router;