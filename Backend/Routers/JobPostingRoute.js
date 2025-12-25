const express = require("express");
const router = express.Router();
const jobController = require("../Controllers/JobPostingController.js");
const { verifyToken } = require("../Middleware/Authentication.js");

// Specific Protected Routes (Static paths go first!)
router.get("/myjobs", verifyToken, jobController.getMyJobs);
router.post("/create", verifyToken, jobController.createJob);

// Specific Action Routes
router.put("/update/:id", verifyToken, jobController.updateJob);
router.delete("/delete/:id", verifyToken, jobController.deleteJob);

// Dynamic Parameter Routes
router.get("/:id", verifyToken, jobController.getJobById);

module.exports = router;