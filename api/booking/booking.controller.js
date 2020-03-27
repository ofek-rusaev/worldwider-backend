const bookingService = require("./booking.service");

async function getBooking(req, res) {
  const booking = await bookingService.getById(req.params.id);
  res.send(booking);
}

async function addBooking(req, res) {
  var booking = req.body;
  try {
    booking = await bookingService.add(booking);
    // console.log("booking- controller", booking);
    res.send(booking);
  } catch (err) {
    res.status(406).send(err);
  }
}

async function getBookings(req, res) {
  const bookings = await bookingService.query(req.query);
  res.send(bookings);
}
async function getBookingsByTourGuideId(req, res) {
  const bookings = await bookingService.getByTourGuideId(req.params.id);
  res.send(bookings);
}

async function getByUserId(req, res) {
  const bookings = await bookingService.getByUserId(req.params.id);
  res.send(bookings);
}

async function deleteBooking(req, res) {
  const bookingId = req.params.id;
  const userId = req.query;
  await bookingService.remove(req.params.id, req.query);
  res.end();
}

async function updateBooking(req, res) {
  const booking = req.body;
  await bookingService.update(booking);
  res.send(booking);
}

module.exports = {
  getBooking,
  getBookings,
  deleteBooking,
  updateBooking,
  addBooking,
  getBookingsByTourGuideId,
  getByUserId
};
