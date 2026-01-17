const express = require("express");
const router = express.Router();
const employeeAppController = require("../Controllers/JobApplicationController.js");
const { verifyEmployee, verifyToken } = require("../Middleware/Authentication.js");

// Routes that require employee verification
router.post("/apply", verifyEmployee, employeeAppController.applyForJob);
router.get("/my-applications", verifyEmployee, employeeAppController.getMyApplications);
router.get("/application/:id", verifyEmployee, employeeAppController.getApplicationById);
router.delete("/withdraw/:application_id", verifyEmployee, employeeAppController.withdrawApplication);

// Worker marks job as completed
router.patch("/:application_id/complete", verifyEmployee, employeeAppController.markJobCompleted);

// Employer confirms job completion (uses verifyToken to allow employer access)
router.patch("/:application_id/confirm-completion", verifyToken, employeeAppController.confirmJobCompletion);

// Employer gets pending confirmations
router.get("/pending-confirmations", verifyToken, employeeAppController.getPendingConfirmations);

module.exports = router;