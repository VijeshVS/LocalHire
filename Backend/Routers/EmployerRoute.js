const express = require("express");
const router = express.Router();
const employerController = require("../Controllers/EmployerController.js");

// Registration and Login
router.post("/register", employerController.registerEmployer);
router.post("/login", employerController.loginEmployer);

// Profile Management
router.get("/profile", employerController.getEmployerProfile);
router.put("/update", employerController.updateEmployerProfile);

module.exports = router;