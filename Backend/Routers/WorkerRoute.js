const express = require("express");
const router = express.Router();
const employeeController = require("../Controllers/WorkerController.js");

// Registration and Login
router.post("/register", employeeController.registerEmployee);
router.post("/login", employeeController.loginEmployee);

// Profile Management
router.get("/profile", employeeController.getEmployeeProfile);
router.put("/update", employeeController.updateEmployeeProfile);

//Skills Management
router.get("/skills", employeeController.getEmployeeSkills);          
router.post("/skills", employeeController.addEmployeeSkill);         
router.delete("/skills/:skill_id", employeeController.removeEmployeeSkill); 

module.exports = router;