const dbService = require("../../services/db.service");
const ObjectId = require("mongodb").ObjectId;

const COLLECTION_NAME = "review";

async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy);
  console.log(criteria);
  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    var reviews = await collection
      .aggregate([
        {
          $match: criteria
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "by"
          }
        },
        {
          $unwind: "$by"
        },
        {
          $project: {
            userId: false,
            "by.password": false,
            "by.isAdmin": false,
            "by.tourId": false,
            "by.email": false,
            "by.languages": false,
            "by.bio": false
          }
        }
      ])
      .toArray();
    // reviews = reviews.map(review => {
    //     review.byUser = {_id: review.byUser._id, username: review.byUser.username}
    //     review.aboutUser = {_id: review.aboutUser._id, username: review.aboutUser.username}
    //     delete review.byUserId;
    //     delete review.aboutUserId;
    return reviews;
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
  review.byUserId = ObjectId(review.byUserId);
  review.aboutUserId = ObjectId(review.aboutUserId);

  const collection = await dbService.getCollection(COLLECTION_NAME);
  try {
    await collection.insertOne(review);
    return review;
  } catch (err) {
    console.log(`ERROR: cannot insert user`);
    throw err;
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
  add
};
