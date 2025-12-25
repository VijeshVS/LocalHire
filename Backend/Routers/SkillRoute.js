const express = require("express");
const router = express.Router();
const skillController = require("../Controllers/SkillController.js");

// Retrieval Routes (Public)
router.get("/domains", skillController.getDomains);
router.get("/domains/all", skillController.getAllDomainsWithSkills);
router.get("/domains/:domain_id/skills", skillController.getSkillsByDomain);

module.exports = router;