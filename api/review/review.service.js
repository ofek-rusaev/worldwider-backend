
const dbService = require('../../services/db.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    const collection = await dbService.getCollection('review')
    try {
        // const reviews = await collection.find(criteria).toArray();
        var reviews = await collection.aggregate([
            {
                $match: criteria
            },
            {
                $lookup:
                {
                    from: 'user',
                    localField: 'tourGuideId',
                    foreignField: '_id',
                    as: 'tourGuide'
                }
            },
            {
                $unwind: '$tourGuide'
            }, {
                $project: {
                    "tourGuide._id": false,
                    "tourGuide.password": false,
                    "tourGuide.isAdmin": false,
                    "tourGuide.tourId": false,
                }
            }
        ]).toArray()
        // reviews = reviews.map(review => {
        //     review.byUser = {_id: review.byUser._id, username: review.byUser.username}
        //     review.aboutUser = {_id: review.aboutUser._id, username: review.aboutUser.username}
        //     delete review.byUserId;
        //     delete review.aboutUserId;
        return reviews;
    }
    catch (err) {
        console.log('ERROR: cannot find reviews')
        throw err;
    }
}

async function remove(reviewId) {
    const collection = await dbService.getCollection('review')
    try {
        await collection.deleteOne({ '_id': ObjectId(reviewId) })
    } catch (err) {
        console.log(`ERROR: cannot remove review ${reviewId}`)
        throw err;
    }
}


async function add(review) {
    review.byUserId = ObjectId(review.byUserId);
    review.aboutUserId = ObjectId(review.aboutUserId);

    const collection = await dbService.getCollection('review')
    try {
        await collection.insertOne(review);
        return review;
    } catch (err) {
        console.log(`ERROR: cannot insert user`)
        throw err;
    }
}

function _buildCriteria(filterBy) {
    const criteria = {};
    return criteria;
}

module.exports = {
    query,
    remove,
    add
}


