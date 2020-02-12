const userCollection = require("../db").db().collection('users')
const followsCollection = require("../db").db().collection('follows')
const ObjectId = require('mongodb').ObjectId //allow to return objectId() this is a tool in mongoDB
const User = require("./user")

class Follow {
    constructor(followedUsername, authorId) {
        this.followedUsername = followedUsername,
        this.authorId = authorId,
        this.errors = []
    }

    cleanUp() {
        if(typeof(this.followedUsername) != "string") {this.followedUsername = ""}
    }

    async validate(action) {
        let followedAccount = await userCollection.findOne({username: this.followedUsername})

        if(followedAccount) {
            this.followedId = followedAccount._id
        }  else {
            this.errors.push("You cannot follow a user that does not exist.")
        }
        
        let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})

        if(action == "create"){
            if(doesFollowAlreadyExist) {this.errors.push("You are already following this user")}
        }

        if(action == "delete"){
            if(!doesFollowAlreadyExist) {this.errors.push("You cannot stop following someone you do not already follow")}
        }

        // avoid following your own account
        if(this.followedId.equals(this.authorId)) {this.errors.push("You cannot follow you own account")}
    }

    create() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp()
            await this.validate("create")

            if(!this.errors.length){
                await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
                resolve()
            } else {
                reject(this.errors)

            }
        })
    }

    delete() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp()
            await this.validate("delete")

            if(!this.errors.length){
                await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
                resolve()
            } else {
                reject(this.errors)

            }
        })
    }
}

Follow.isVisitorFollowing = async (followedId, visitorId) => {
    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectId(visitorId)})

    if(followDoc){
        return true
    } else {
        return false
    }
}

Follow.getFollowersById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}},
                {$lookup: {
                    from: "users",
                    localField: "authorId",
                    foreignField: "_id",
                    as: "userDoc"
                }},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            console.log(followers)
            followers = followers.map((follower) => {
                // create user
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })
            resolve(followers)
        } catch {
            reject()
        }
    })
}

Follow.getFollowingById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let following = await followsCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup: {
                    from: "users",
                    localField: "followedId",
                    foreignField: "_id",
                    as: "userDoc"
                }},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            following = following.map((follower) => {
                // create user
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })
            resolve(following)
        } catch {
            reject()
        }
    })
}

Follow.countFollowerById = (userId) => {
    return new Promise((resolve, reject) => {
        let totalFollower = followsCollection.countDocuments({followedId: userId})
        resolve(totalFollower)
    })
}

Follow.countFollowingById = (userId) => {
    return new Promise((resolve, reject) => {
        let totalFollowing = followsCollection.countDocuments({authorId: userId})
        resolve(totalFollowing)
    })
}

module.exports = Follow 