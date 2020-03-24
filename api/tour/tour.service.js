const dbService = require("../../services/db.service");
const reviewService = require("../review/review.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  query,
  getById,
  getByEmail,
  remove,
  update,
  getEmpty,
  add
};

async function query(filterBy) {
  console.log('Before _ filterBy: ', filterBy);
  if (!filterBy.minPrice) {
    filterBy.minPrice = '0'
  }
  if (!filterBy.maxPrice) {
    filterBy.maxPrice = '10000000'
  }
  if (!filterBy.minRating) {
    filterBy.minRating = '0'
  }
  if (!filterBy.maxRating) {
    filterBy.maxRating = '5'
  }


  console.log('After _ filterBy: ', filterBy);

  const criteria = _buildCriteria(filterBy);
  // const criteria = {}
  console.log('criteria: ', criteria);
  const COLLECTION_NAME = "tour";

  async function query(
    filterBy = { minPrice: 0, maxPrice: Infinity, minRating: 0, maxRating: 5 })
  const criteria = _buildCriteria(filterBy);
  console.log("criteria: ", criteria);

  const tourCollection = await dbService.getCollection(COLLECTION_NAME);
  try {
    let tours = await tourCollection
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
          $project: {
            "tourGuide._id": false,
            "tourGuide.password": false,
            "tourGuide.isAdmin": false,
            "tourGuide.tourId": false
          }
        }

      ])
      .toArray();

    return tours;
  } catch (error) {
    console.log("ERROR: cannot find tours");
    throw error;
  }
}

async function getById(tourId) {
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    const tour = await collection.findOne({ _id: ObjectId(tourId) });
    delete tour.password;
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
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    const tour = await collection.findOne({ email });
    return tour;
  } catch (err) {
    console.log(`ERROR: while finding tour ${email}`);
    throw err;
  }
}

async function remove(tourId) {
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    await collection.deleteOne({ _id: ObjectId(tourId) });
  } catch (err) {
    console.log(`ERROR: cannot remove tour ${tourId}`);
    throw err;
  }
}

async function update(tour) {
  const collection = await dbService.getCollection(COLLECTION_NAME);
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
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    await collection.insertOne(tour);
    userService.update(tour);
    return tour;
  } catch (err) {
    console.log(`ERROR: cannot insert tour`);
    throw err;
  }
}

function getEmpty() {
  return {
    name: "Tour Name",
    city: "Tel Aviv",
    desc:
      "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptatum fugit perspiciatis ex quis vitae libero explicabo laboriosam. Nobis necessitatibus maiores dicta ex soluta maxime, fugit, ab sunt, consectetur reprehenderit accusamus.",
    tags: ["food", "night life"],
    spots: [
      {
        name: "Barrio Shoreditch",
        loc: {
          lat: 51.5260442,
          lng: -0.0781866
        }
      },
      {
        name: "Shoreditch",
        loc: {
          lat: 51.5229106,
          lng: -0.0777472
        }
      }
    ],
    price: 0,
    tourImgUrls: [
      "https://res.cloudinary.com/ddkf2aaiu/image/upload/v1584887490/london-shore-min_z5vxxw.png"
    ],
    maxAttendees: 3
  };
}

function _buildCriteria(filterBy) {
  // console.log('_buildCriteria FILTER BY : ', filterBy);

  var criteria = {};
  // console.log('_buildCriteria - filterBy: ', filterBy)
  if (filterBy.city) {
    var regex = new RegExp(filterBy.city, 'i');
    criteria.city = { $regex: regex };
  }
  if (filterBy.price) {
    criteria.price = {
      $gte: +filterBy.minPrice,
      $lte: +filterBy.maxPrice
    }
    console.log('IN IF filterBy.price - criteria.price ::::: ', criteria.price);
  }
  if (filterBy.rating) {
    criteria.rating = {
      $lte: +filterBy.maxRating,
      $gte: +filterBy.minRating
    }
    console.log('IN IF filterBy.rating - criteria.rating ::::: ', criteria.rating);
  }
  console.log('IN IF filterBy.price - criteria.price ::::: ', criteria);
  // }
  // if (filterBy.rating) {
  // criteria.rating = {

  //   $lte: +filterBy.maxRating,
  //   $gt: +filterBy.minRating

  // }
  // console.log('IN IF filterBy.rating - criteria.rating ::::: ', criteria.rating);
  // }
  if (filterBy.tourGuideId) {
    // console.log('filterBy.tourGuideId', filterBy.tourGuideId);

    criteria.tourGuideId = ObjectId(filterBy.tourGuideId);
  }
  if (filterBy.tourId) {
    // console.log('filterBy.tourId', filterBy.tourId);
    criteria._id = ObjectId(filterBy.tourId)
  }
  if (filterBy.tags) {
    //Gets an array of tags
    criteria.tags = { $eq: filterBy.tags };
  }
  console.log("criteria is: ", criteria);

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
