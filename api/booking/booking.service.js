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
            from: "user",
            localField: "tourGuideId",
            foreignField: "_id", //belong to the "from" collection
            as: "tourGuide"
          }
        },
        {
          $unwind: "$tourGuide"
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
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    await collection.insertOne(booking);
    return booking;
  } catch (err) {
    console.log(`ERROR: cannot insert booking`);
    throw err;
  }
}

function _buildCriteria(filterBy) {
  var criteria = {};

  if (filterBy.bookingId) {
    criteria._Id = ObjectId(filterBy.bookingId);
  }
  if (filterBy.tourGuideId) {
    criteria.tourGuideId = ObjectId(filterBy.tourGuideId);
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
