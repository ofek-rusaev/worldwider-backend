const dbService = require("../../services/db.service");
const reviewService = require("../review/review.service");
const tourService = require("../tour/tour.service");
const userService = require("../user/user.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  query,
  getById,
  remove,
  update,
  add,
  getByTourGuideId,
  getByUserId
};
COLLECTION_NAME = "booking";
async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy);
  const tourCollection = await dbService.getCollection(COLLECTION_NAME);
  try {
    let bookings = await tourCollection
      .aggregate([
        {
          $match: criteria
        },
        {
          $lookup: {
            from: "tour",
            localField: "tourId",
            foreignField: "_id", //belong to the "from" collection
            as: "tour"
          }
        },
        {
          $unwind: "$tour"
        },
        {
          $lookup: {
            from: "user",
            localField: "attendees",
            foreignField: "_id", //belong to the "from" collection
            as: "attendees"
          }
        },
        {
          $project: {
            "tour.price": false,
            "tourGuide._id": false,
            "tourGuide.password": false,
            "tourGuide.isAdmin": false,
            "tourGuide.tourId": false,
            "attendees.password": false,
            "attendees.languages": false,
            "attendees.email": false,
            "attendees.isAdmin": false,
            "attendees.tourId": false,
            "attendees._id": false
          }
        }
      ])
      .toArray();
    return bookings;
  } catch (error) {
    console.log("ERROR: cannot find bookings");
    throw error;
  }
}

async function getByTourGuideId(tourGuideId) {
  const bookingCollection = await dbService.getCollection(COLLECTION_NAME);

  try {
    const tour = await tourService.getByTourGuideId(tourGuideId);
    const guideBookings = await bookingCollection
      .find({
        tourId: ObjectId(tour._id)
      })
      .toArray();
    if (guideBookings.length === 0) {
      return guideBookings;
    }

    const bookings = await Promise.all(
      guideBookings.map(async booking => {
        return {
          _id: booking._id,
          date: booking.date,
          tour: {
            _id: tour._id,
            name: tour.name
          },
          reservations: await getBookingReservations(booking.reservations)
        };
      })
    );
    return bookings;
  } catch (error) {
    console.log("ERROR: cannot find bookings");
    throw error;
  }
}

//gets an array of reservations (userId, totalCost, attendeesAmount)
//and returns the same array with all the user details
async function getBookingReservations(reservations) {
  return await Promise.all(
    reservations.map(async reservation => {
      const user = await userService.getById(reservation.userId);
      return {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          _id: user._id,
          email: user.email,
          imgUrl: user.imgUrl
        },
        attendees: reservation.attendees,
        totalCost: reservation.totalCost
      };
    })
  );
}

async function getByUserId(userId) {
  console.log("fetching by user...");
  const bookingCollection = await dbService.getCollection(COLLECTION_NAME);
  try {
    let bookings = await bookingCollection
      .aggregate([
        {
          $match: {
            "reservations.userId": ObjectId(userId)
          }
        }
      ])
      .toArray();
    return await Promise.all(
      bookings.map(async booking => {
        const tour = await tourService.getById(booking.tourId);
        const guide = await userService.getById(tour.tourGuideId);
        const idx = booking.reservations.findIndex(
          reservation => reservation.userId.toString() === userId
        );
        return {
          _id: booking._id,
          date: booking.date,
          totalCost: booking.reservations[idx].totalCost,
          tour: {
            tourId: tour._id,
            name: tour.name,
            city: tour.city,
            tourImgUrls: tour.tourImgUrls
          },
          guide: {
            _id: guide._id,
            firstName: guide.firstName,
            lastName: guide.lastName,
            userImgUrl: guide.userImgUrl
          }
        };
      })
    );
  } catch (error) {
    throw error;
  }
}

async function getById(bookingId) {
  const collection = await dbService.getCollection(COLLECTION_NAME);

  try {
    const booking = await collection.findOne({ _id: ObjectId(bookingId) });
    return booking;
  } catch (err) {
    console.log(`ERROR: while finding booking ${bookingId}`);
    throw err;
  }
}

async function remove(bookingId) {
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    await collection.deleteOne({ _id: ObjectId(bookingId) });
  } catch (err) {
    console.log(`ERROR: cannot remove booking ${bookingId}`);
    throw err;
  }
}

async function update(booking) {
  const collection = await dbService.getCollection(COLLECTION_NAME);
  booking._id = ObjectId(booking._id);

  try {
    await collection.replaceOne({ _id: booking._id }, { $set: booking });
    return booking;
  } catch (err) {
    console.log(`ERROR: cannot update booking ${booking._id}`);
    throw err;
  }
}

async function add(booking) {
  const bookingCollection = await dbService.getCollection(COLLECTION_NAME);
  const tourCollection = await dbService.getCollection("tour");
  try {
    let bookingInstance = await bookingCollection
      .aggregate([
        {
          $match: {
            date: { $eq: booking.date },
            tourId: ObjectId(booking.tourId)
          }
        }
      ])
      .toArray();
    const tour = await tourCollection.findOne({
      _id: ObjectId(booking.tourId)
    });
    // console.log(tour);
    // console.log('booking', bookingInstance);

    if (booking.attendeesAmount > tour.maxAttendees) {
      //overbooking
      throw "overbooking";
    }

    const reservation = {
      userId: ObjectId(booking.userId),
      attendees: +booking.attendeesAmount,
      totalCost: booking.totalCost
    };

    if (bookingInstance.length === 0) {
      //no instance for this tour on this day

      const bookingToInsert = {
        tourId: ObjectId(booking.tourId),
        date: booking.date,
        reservations: [reservation]
      };
      return await bookingCollection.insertOne(bookingToInsert);
    } else {
      //Instance is already exist
      const bookingToInsert = JSON.parse(JSON.stringify(bookingInstance[0]));
      existingBookingInstanceId = ObjectId(bookingToInsert._id);
      bookingToInsert.tourId = ObjectId(bookingToInsert.tourId);
      delete bookingToInsert._id;

      currentAttendeesNum = 0;
      bookingToInsert.reservations.map(reservation => {
        currentAttendeesNum += reservation.attendees;
      });
      if (+booking.attendeesAmount > tour.maxAttendees - currentAttendeesNum) {
        //overbooking
        throw "overbooking";
      } else {
        console.log('final booking', bookingToInsert)

        bookingToInsert.reservations.unshift(reservation);
        await bookingCollection.updateOne(
          { _id: existingBookingInstanceId },
          { $set: bookingToInsert }
        );
        return bookingToInsert;
      }
    }
  } catch (err) {
    console.log(`ERROR: cannot insert booking, Reason:`, err);
    throw err;
  }
}

function _buildCriteria(filterBy) {
  var criteria = {};

  if (filterBy.bookingId) {
    criteria._Id = ObjectId(filterBy.bookingId);
  }
  if (filterBy.tourId) {
    criteria.tourId = ObjectId(filterBy.tourId);
  }

  return criteria;
}

function _dynamicSort(property) {
  property = property.toLowerCase();
  // if (property === 'created') property = 'createdAt'
  return function (a, b) {
    if (property === "name")
      return a[property].toLowerCase() < b[property].toLowerCase()
        ? -1
        : a[property].toLowerCase() > b[property].toLowerCase()
          ? 1
          : 0;
    // else if (property === 'createdAt') return -1
    else return a[property] - b[property];
  };
}
