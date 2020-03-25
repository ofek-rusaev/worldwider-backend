const dbService = require("../../services/db.service");
const reviewService = require("../review/review.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  query,
  getById,
  remove,
  update,
  add
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
            "tourGuide._id": false,
            "tourGuide.password": false,
            "tourGuide.isAdmin": false,
            "tourGuide.tourId": false,
            "attendees.password": false,
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
    console.log(tour);
    console.log(bookingInstance);

    if (booking.attendeesAmount > tour.maxAttendees) {
      //overbooking
      throw "overbooking";
    }
    console.log("length,", bookingInstance.length);
    console.log("bookingInstance", bookingInstance);
    if (bookingInstance.length === 0) {
      //no instance for this tour on this day

      const bookingToInsert = {
        tourId: ObjectId(booking.tourId),
        date: booking.date
      };

      bookingToInsert.attendees = new Array(+booking.attendeesAmount).fill(
        ObjectId(booking.userId)
      );

      const bookingFromDB = await bookingCollection.insertOne(bookingToInsert);
    } else {
      const bookingToInsert = JSON.parse(JSON.stringify(bookingInstance[0]));
      existingBookingInstanceId = ObjectId(bookingToInsert._id);
      delete bookingToInsert._id;
      if (
        tour.maxAttendees - bookingToInsert.attendees.length <
        +booking.attendeesAmount
      ) {
        //overbooking
        throw "overbooking";
      } else {
        for (let i = 0; i < +booking.attendeesAmount; i++) {
          bookingToInsert.attendees.unshift(booking.userId);
        }
        console.log(bookingToInsert._id);
        const bookingFromDB = await bookingCollection.replaceOne(
          { _id: existingBookingInstanceId },
          { $set: bookingToInsert }
        );
      }
    }
    return bookingFromDB;
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
  return function(a, b) {
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
