const dbService = require("../../services/db.service");
const reviewService = require("../review/review.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  query,
  getById,
  getByEmail,
  remove,
  update,
  add,
};

async function query(filterBy = { minPrice: 0, maxPrice: Infinity, minRating: 0, maxRating: 5 }) {
  const criteria = _buildCriteria(filterBy);
  console.log('criteria: ', criteria);

  const tourCollection = await dbService.getCollection("tour");
  try {
    let tours = await tourCollection.aggregate([
      {
        $match: criteria

      },
      {
        $lookup:
        {
          from: 'user',
          localField: "tourGuideId",
          foreignField: "_id", //belong to the "from" collection
          as: "tourGuide"
        }
      },
      {
        $unwind: '$tourGuide'
      },
      {
        $project: {
          "tourGuide._id": false,
          "tourGuide.password": false,
          "tourGuide.isAdmin": false,
          "tourGuide.tourId": false,
        }
      }
    ]).toArray()
    console.log('tours in try: ', tours)

    return tours;
  }
  catch (error) {
    console.log('ERROR: cannot find tours')
    throw error;
  }
}

async function getById(tourId) {
  const collection = await dbService.getCollection("user");
  try {
    const tour = await collection.findOne({ _id: ObjectId(tourId) });
    delete tour.password;
    // console.log('backendddddd', tour)
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
  var criteria = {};
  console.log(filterBy)
  if (filterBy.city) {
    criteria.city = filterBy.city;
  }
  if (filterBy.price) {

    criteria.price = {
      $gte: filterBy.minPrice,
      $lte: filterBy.maxPrice
    }
  }
  if (filterBy.rating) {
    criteria.rating = {
      $lte: filterBy.maxRating,
      $gte: filterBy.minRating
    }
  }


  if (filterBy.tourGuideId) {
    console.log('filterBy.tourGuideId', filterBy.tourGuideId);

    criteria.tourGuideId = ObjectId(filterBy.tourGuideId)
  }
  if (filterBy.tourId) {
    console.log('filterBy.tourId', filterBy.tourId);
    criteria._id = ObjectId(filterBy.tourId)
  }
  if (filterBy.tags) {
    //Gets an array of tags
    criteria.tags = { $eq: filterBy.tags }
  }
  console.log('criteria is: ', criteria);

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
