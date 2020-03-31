const dbService = require("../../services/db.service");
const ObjectId = require("mongodb").ObjectId;

const COLLECTION_NAME = "review";

async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy);
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    var reviews = await collection
      .aggregate([
        {
          $match: criteria
        }
      ])
      .toArray();
    // var reviewsWithUsers = await collection
    //   .aggregate([
    //     {
    //       $match: criteria
    //     },
    //     {
    //       $lookup: {
    //         from: "user",
    //         localField: "userId",
    //         foreignField: "_id",
    //         as: "by"
    //       }
    //     },
    //     {
    //       $unwind: "$by"
    //     },
    //     {
    //       $project: {
    //         userId: false,
    //         "by.password": false,
    //         "by.isAdmin": false,
    //         "by.tourId": false,
    //         "by.email": false,
    //         "by.languages": false,
    //         "by.bio": false
    //       }
    //     }
    //   ])
    //   .toArray();
    let sum = 0;
    const reviewsToReturn = await Promise.all(
      reviews.map(async review => {
        sum += review.rating;
        if (review.userId) {
          const userCollection = await dbService.getCollection("user");
          try {
            const user = await userCollection.findOne({
              _id: ObjectId(review.userId)
            });
            if (user != null) {
              review.by = {
                _id: user._id,
                lastName: user.lastName,
                firstName: user.firstName,
                createdAt: user.createdAt,
                userImgUrl: user.userImgUrl
              };
            } else {
              review.by = {
                firstName: review.name
              };
            }
          } catch (err) {
            console.log(err);
          }
        } else if (review.userId === null) {
          review.by = {
            firstName: review.name
          };
        }
        return review;
      })
    );
    // console.log("reviewToReturn", reviewsToReturn);
    return {
      reviews: reviewsToReturn,
      avg: (sum / reviews.length).toFixed(1),
      total: reviews.length
    };
  } catch (err) {
    console.log("ERROR: cannot find reviews");
    throw err;
  }
}

async function remove(reviewId) {
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    await collection.deleteOne({ _id: ObjectId(reviewId) });
  } catch (err) {
    console.log(`ERROR: cannot remove review ${reviewId}`);
    throw err;
  }
}

async function add(review) {
  if (review.userId) {
    review.userId = ObjectId(review.userId);
  }
  review.tourGuideId = ObjectId(review.tourGuideId);
  review.createdAt = Date.now();
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    await collection.insertOne(review);
    return review;
  } catch (err) {
    console.log(`ERROR: cannot insert user`);
    throw err;
  }
}

async function getTotalByGuideId(guideId) {
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    var reviews = await collection
      .aggregate([
        {
          $match: {
            tourGuideId: ObjectId(guideId)
          }
        }
      ])
      .toArray();

    let sum = 0;
    reviews.map(review => {
      if (typeof review.rating === "number") sum += review.rating;
    });
    let avg = sum / reviews.length;
    if (!avg) {
      avg = 0;
    }
    return {
      total: reviews.length,
      avg: avg.toFixed(1)
    };
  } catch (error) {
    throw error;
  }
}

function _buildCriteria(filterBy) {
  const criteria = {};
  if (filterBy.userId) {
    criteria.userId = ObjectId(filterBy.userId);
  }
  if (filterBy.tourGuideId) {
    criteria.tourGuideId = ObjectId(filterBy.tourGuideId);
  }
  return criteria;
}

module.exports = {
  query,
  remove,
  add,
  getTotalByGuideId
};
