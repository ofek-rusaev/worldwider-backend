const tourService = require("./tour.service");

async function getTour(req, res) {
  const tour = await tourService.getById(req.params.id);
  res.send(tour);
}

async function addTour(req, res) {
  var tour = req.body;
  tour = await tourService.add(tour);
  console.log('inside controller', tour)
  // TODO - need to find aboutUser
  res.send(tour);
}

async function getTours(req, res) {
  // console.log('getTours', req.query);
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
