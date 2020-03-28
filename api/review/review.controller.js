const logger = require("../../services/logger.service");
const reviewService = require("./review.service");

// TODO: needs error handling! try, catch

async function getReviews(req, res) {
  try {
    const reviews = await reviewService.query(req.query);
    res.json(reviews);
  } catch (err) {
    logger.error("Cannot get reviews", err);
    res.status(500).send({ error: "cannot get reviews" });
  }
}
async function getByUserId() {
  try {
    const reviews = await reviewService.getTotalByGuideId(req.params.id);
    res.json(reviews);
  } catch (err) {
    logger.error("Cannot get reviews", err);
    res.status(500).send({ error: "cannot get reviews" });
  }
}

async function deleteReview(req, res) {
  await reviewService.remove(req.params.id);
  res.end();
}

async function addReview(req, res) {
  var review = req.body;
  review = await reviewService.add(review);

  review.byUser = req.session.user;
  // TODO - need to find aboutUser
  res.send(review);
}

module.exports = {
  getReviews,
  deleteReview,
  addReview
};
