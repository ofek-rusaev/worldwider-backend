const bookingService = require("./booking.service");

async function getBooking(req, res) {
  const booking = await bookingService.getById(req.params.id);
  res.send(booking);
}

async function addBooking(req, res) {
  var booking = req.body;
  booking = await bookingService.add(booking);
  res.send(booking);
}

async function getBookings(req, res) {
  const bookings = await bookingService.query(req.query);
  res.send(bookings);
}

async function deleteBooking(req, res) {
  await bookingService.remove(req.params.id);
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
  addBooking
};
