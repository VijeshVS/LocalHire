const express = require("express");
const router = express.Router();
const skillController = require("../Controllers/SkillController.js");

// Retrieval Routes (Public)
router.get("/skills", skillController.getAllSkills);
router.get("/skills/requested", skillController.getAllRequestedSkills);

module.exports = router;