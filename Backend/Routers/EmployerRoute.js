const express = require("express");
const router = express.Router();
const employerController = require("../Controllers/EmployerController.js");
const { verifyToken } = require("../Middleware/Authentication.js");

// Registration and Login
router.post("/register", employerController.registerEmployer);
router.post("/login", employerController.loginEmployer);

// Profile Management
router.get("/profile", verifyToken, employerController.getEmployerProfile);
router.put("/update", verifyToken, employerController.updateEmployerProfile);

module.exports = router;