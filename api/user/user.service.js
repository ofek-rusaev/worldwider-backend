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
  updateTour
};

async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy);
  // console.log("in query BE: criteria", criteria);
  // console.log("in query BE: filterBy", filterBy);

  const collection = await dbService.getCollection("user");
  try {
    // const users = await collection.find({}).toArray();
    const users = await collection.find(criteria).toArray();
    users.forEach(user => delete user.password);
    // console.log('in query BE: ', users);

    return users;
  } catch (err) {
    console.log("ERROR: cannot find users");
    throw err;
  }
}
async function getById(userId) {
  const collection = await dbService.getCollection("user");
  try {
    const user = await collection.findOne({ _id: ObjectId(userId) });
    const rating = await reviewService.getTotalByGuideId(userId);
    user.rating = rating;
    delete user.password;
    return user;
  } catch (err) {
    console.log(`ERROR: while finding user ${userId}`);
    throw err;
  }
}
async function getByEmail(email) {
  const collection = await dbService.getCollection("user");
  try {
    const user = await collection.findOne({ email });
    return user;
  } catch (err) {
    console.log(`ERROR: while finding user ${email}`);
    throw err;
  }
}

async function remove(userId) {
  const collection = await dbService.getCollection("user");
  try {
    await collection.deleteOne({ _id: ObjectId(userId) });
  } catch (err) {
    console.log(`ERROR: cannot remove user ${userId}`);
    throw err;
  }
}

// Update one:
// db.customer.updateOne({"_id":ObjectId("579c6ecab87b4b49be12664c")}, {$set:{balance: 20}})

async function update(user) {
  const collection = await dbService.getCollection("user");
  user._id = ObjectId(user._id);
  query(filter);
  try {
    await collection.updateOne({ _id: user._id }, { $set: user });
    return user;
  } catch (err) {
    console.log(`ERROR: cannot update user ${user._id}`);
    throw err;
  }
}

async function add(user) {
  const collection = await dbService.getCollection("user");
  try {
    await collection.insertOne(user);
    return user;
  } catch (err) {
    console.log(`ERROR: cannot insert user`);
    throw err;
  }
}

async function updateTour(userId, tourId) {
  const collection = await dbService.getCollection("user");
  // Update one:
  collection.updateOne({ _id: ObjectId(userId) }, { $set: { tourId } });
}

function _buildCriteria(filterBy) {
  const criteria = {};
  if (filterBy.txt) {
    criteria.city = filterBy.txt;
  }
  if (filterBy.tourGuideId) {
    criteria.tourGuideId = { $eq: filterBy.tourGuideId };
  }
  // if (filterBy.price) {
  //   criteria.price = { $gt: filterBy.tourGuideId };
  // }

  return criteria;
}
