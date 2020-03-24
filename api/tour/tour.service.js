const dbService = require("../../services/db.service");
const reviewService = require("../review/review.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  query,
  getById,
  getByEmail,
  remove,
  update,
  add
};

async function query(filterBy = {}) {
  console.log("query filterBy: ", filterBy);

  const criteria = _buildCriteria(filterBy);
  const collection = await dbService.getCollection("user");
  try {

    const tours = await collection.aggregate([
      {
        $match: { "tour._id": { $ne: null } }
      }
    ]).toArray();
    return tours;
  } catch (err) {
    console.log("ERROR: cannot find tours");
    throw err;
  }
}

async function getById(tourId) {
  const collection = await dbService.getCollection("user");
  try {
    const tour = await collection.findOne({ _id: ObjectId(tourId) });
    delete tour.password;
    console.log('backendddddd', tour)
    tour.givenReviews = await reviewService.query({
      byTourId: ObjectId(tour._id)
    });
    tour.givenReviews = tour.givenReviews.map(review => {
      delete review.byTour;
      return review;
    });
    return tour;
  } catch (err) {
    console.log(`ERROR: while finding tour ${tourId}`);
    throw err;
  }
}
async function getByEmail(email) {
  const collection = await dbService.getCollection("user");
  try {
    const tour = await collection.findOne({ email });
    return tour;
  } catch (err) {
    console.log(`ERROR: while finding tour ${email}`);
    throw err;
  }
}

async function remove(tourId) {
  const collection = await dbService.getCollection("user");
  try {
    await collection.deleteOne({ _id: ObjectId(tourId) });
  } catch (err) {
    console.log(`ERROR: cannot remove tour ${tourId}`);
    throw err;
  }
}

async function update(tour) {
  const collection = await dbService.getCollection("user");
  tour._id = ObjectId(tour._id);

  try {
    await collection.replaceOne({ _id: tour._id }, { $set: tour });
    return tour;
  } catch (err) {
    console.log(`ERROR: cannot update tour ${tour._id}`);
    throw err;
  }
}

async function add(tour) {
  const collection = await dbService.getCollection("user");
  try {
    await collection.insertOne(tour);
    return tour;
  } catch (err) {
    console.log(`ERROR: cannot insert tour`);
    throw err;
  }
}

function _buildCriteria(filterBy) {
  var criteria = { $and: [] };
  if (filterBy.name) {
    criteria.$and.push({ name: filterBy.name });
  }
  if (filterBy.type) {
    criteria.$and.push({ type: filterBy.type });
  }
  if (filterBy.inStock) {
    criteria.$and.push({ inStock: filterBy.inStock });
  }
  if (criteria.$and.length === 0) {
    criteria = {};
  }
  // const criteria = {}
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
