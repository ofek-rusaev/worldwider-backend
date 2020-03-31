const dbService = require("../../services/db.service");
const reviewService = require("../review/review.service");
const userService = require("../user/user.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  query,
  getById,
  getByEmail,
  remove,
  update,
  getEmpty,
  add,
  getByTourGuideId
};
const COLLECTION_NAME = "tour";

async function query(filterBy) {
  if (!filterBy.minPrice) {
    filterBy.minPrice = "0";
  }
  if (!filterBy.maxPrice) {
    filterBy.maxPrice = "10000000";
  }
  if (!filterBy.minRating) {
    filterBy.minRating = "0";
  }
  if (!filterBy.maxRating) {
    filterBy.maxRating = "5";
  }
  const criteria = _buildCriteria(filterBy);

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

    const toursToReturn = await Promise.all(
      tours.map(async tour => {
        tour.tourGuide.rating = await reviewService.getTotalByGuideId(
          tour.tourGuideId
        );
        return tour;
      })
    );
    // console.log(filterBy.sort);
    toursToReturn.sort(_dynamicSort(filterBy));
    return toursToReturn;
    // return tours;
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
    // tour.givenReviews = tour.givenReviews.map(review => {
    //   delete review.byTour;
    //   return review;
    // });
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
async function getByTourGuideId(tourGuideId) {
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    const tour = await collection.findOne({
      tourGuideId: ObjectId(tourGuideId)
    });
    return tour;
  } catch (err) {
    console.log(`ERROR: cannot find tour ${tourId}`);
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
  // console.log("in tour service -tour should have ID NOW: ", tour);

  try {
    await collection.replaceOne({ _id: tour._id }, { $set: tour });
    return tour;
  } catch (err) {
    console.log(`ERROR: cannot update tour ${tour._id}`);
    throw err;
  }
}

async function add(tour) {
  // tour._id = ObjectId(tour._id);
  tour.tourGuideId = ObjectId(tour.tourGuideId);
  // userService.updateTour()
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    await collection.insertOne(tour);
    const tourId = tour._id;
    const userId = tour.tourGuideId;
    userService.updateTour(userId, tourId);

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
  var criteria = {};
  if (filterBy.city) {
    var regex = new RegExp(filterBy.city, "i");
    criteria.city = { $regex: regex };
  }
  // if (filterBy.price) {
  criteria.price = {
    $gte: +filterBy.minPrice,
    $lte: +filterBy.maxPrice
  };
  // }
  // if (filterBy.rating) {
  //   criteria.rating = {
  //     $gte: +filterBy.minRating,
  //     $lte: +filterBy.maxRating
  //   };
  // }
  // }
  // if (filterBy.rating) {
  // criteria.rating = {

  //   $lte: +filterBy.maxRating,
  //   $gt: +filterBy.minRating

  // }
  // }
  if (filterBy.tourGuideId) {
    criteria.tourGuideId = ObjectId(filterBy.tourGuideId);
  }
  if (filterBy.tourId) {
    criteria._id = ObjectId(filterBy.tourId);
  }
  if (filterBy.tags) {
    //Gets an array of tags
    criteria.tags = { $eq: filterBy.tags };
  }

  return criteria;
}

function _dynamicSort(filterBy) {
  // property = property.toLowerCase();
  // if (property === 'created') property = 'createdAt'
  return function(a, b) {
    // console.log(a, "b", b);
    // console.log(console.log(property));
    // console.log(a.tourGuide[property].avg);
    // console.log(Object.keys(a.tourGuide));
    if (filterBy.rating !== null) {
      if (a.tourGuide["rating"].avg < b.tourGuide["rating"].avg) {
        if (filterBy.rating === true) {
          return 1;
        }
      } else {
        return -1;
      }
      if (a.tourGuide["rating"].avg > b.tourGuide["rating"].avg) {
        if (filterBy.rating === true) {
          return -1;
        }
      } else {
        return 1;
      }
      return 0;
      // return a.tourGuide[property].avg - b.tourGuide[property].avg;
    }
  };
}

//keren
