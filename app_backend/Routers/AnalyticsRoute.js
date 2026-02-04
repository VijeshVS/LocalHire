const express = require("express");
const router = express.Router();
const { verifyToken } = require("../Middleware/Authentication.js");
const {
  getEmployerAnalytics,
  getWorkerAnalytics,
} = require("../Controllers/AnalyticsController.js");

// Employer analytics
router.get("/employer", verifyToken, getEmployerAnalytics);

// Worker analytics
router.get("/worker", verifyToken, getWorkerAnalytics);

module.exports = router;
