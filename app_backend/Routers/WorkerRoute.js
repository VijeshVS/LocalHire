const express = require("express");
const router = express.Router();
const employeeController = require("../Controllers/WorkerController.js");
const { verifyToken } = require("../Middleware/Authentication.js");

// Registration and Login
router.post("/register", employeeController.registerEmployee);
router.post("/login", employeeController.loginEmployee);

// Profile Management
router.get("/profile", verifyToken, employeeController.getEmployeeProfile);
router.put("/update", verifyToken, employeeController.updateEmployeeProfile);

//Skills Management       
router.post("/skills", verifyToken, employeeController.addEmployeeSkill);         
router.delete("/skills/:skill_id", verifyToken, employeeController.removeEmployeeSkill); 

module.exports = router;