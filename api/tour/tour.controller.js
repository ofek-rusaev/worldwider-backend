const tourService = require("./tour.service");

async function getTour(req, res) {
  if (req.params.id === "empty") {

    res.send(tourService.getEmpty());
  } else {
    const tour = await tourService.query({ tourId: req.params.id });
    res.send(tour);
  }
  // const tour = await tourService.query({ tourId: req.params.id });
  // res.send(tour);
}

async function addTour(req, res) {
  var tour = req.body;
  tour = await tourService.add(tour);
  // TODO - need to find aboutUser
  res.send(tour);
}

async function getTours(req, res) {
  const tours = await tourService.query(req.query);
  res.send(tours);
}

async function deleteTour(req, res) {
  await tourService.remove(req.params.id);
  res.end();
}

async function updateTour(req, res) {
  const tour = req.body;
  await tourService.update(tour);
  res.send(tour);
}

module.exports = {
  getTour,
  getTours,
  deleteTour,
  updateTour,
  addTour
};
