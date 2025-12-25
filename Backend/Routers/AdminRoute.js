const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/AdminController.js");
const { verifyAdmin } = require("../Middleware/Authentication.js");

// 1. Auth Routes
router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);

// 2. Domain Routes (Protected)
router.post("/domains", verifyAdmin, adminController.addDomain);
router.put("/domains/:id", verifyAdmin, adminController.updateDomain);
router.delete("/domains/:id", verifyAdmin, adminController.deleteDomain);

// 3. Skill Routes (Protected)
router.post("/skills", verifyAdmin, adminController.addSkill);
router.put("/skills/:id", verifyAdmin, adminController.updateSkill);
router.delete("/skills/:id", verifyAdmin, adminController.deleteSkill);

module.exports = router;