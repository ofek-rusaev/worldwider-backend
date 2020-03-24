const express = require("express");
const {
  requireAuth,
  requireAdmin
} = require("../../middlewares/requireAuth.middleware");
const {
  getTour,
  addTour,
  getTours,
  getTourGuides,
  deleteTour,
  updateTour
} = require("./tour.controller");
const router = express.Router();


// middleware that is specific to this router
// router.use(requireAuth)

router.get("/", getTours);
// router.get("/", getTourGuides);
router.post("/", addTour);
router.get("/:id", getTour);
router.put("/:id", updateTour);
router.delete("/:id", deleteTour);

module.exports = router;
