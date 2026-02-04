const express = require("express");
const router = express.Router();
const { verifyEmployee } = require("../Middleware/Authentication.js");
const jobOfferController = require("../Controllers/JobOfferController.js");

// All routes require worker authentication
router.use(verifyEmployee);

// Get all job offers for the logged-in worker
router.get("/", jobOfferController.getWorkerJobOffers);

// Get job offer statistics
router.get("/stats", jobOfferController.getJobOfferStats);

// Get worker's schedule for a specific date
router.get("/schedule", jobOfferController.getWorkerSchedule);

// Check worker availability for a time slot
router.get("/check-availability", jobOfferController.checkWorkerAvailability);

// Get single job offer details
router.get("/:offer_id", jobOfferController.getJobOfferDetails);

// Accept a job offer
router.post("/:offer_id/accept", jobOfferController.acceptJobOffer);

// Reject a job offer
router.post("/:offer_id/reject", jobOfferController.rejectJobOffer);

module.exports = router;
