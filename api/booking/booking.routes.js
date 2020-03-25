const express = require("express");
const {
  requireAuth,
  requireAdmin
} = require("../../middlewares/requireAuth.middleware");
const {
  getBooking,
  addBooking,
  getBookings,
  deleteBooking,
  updateBooking,
  getBookingsByTourGuideId,
  getByUserId
} = require("./booking.controller");
const router = express.Router();

// middleware that is specific to this router
// router.use(requireAuth)

router.get("/", getBookings);
router.post("/", addBooking);
router.get("/tourGuide/:id", getBookingsByTourGuideId);
router.get("/user/:id", getByUserId);
router.get("/:id", getBooking);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);

module.exports = router;
