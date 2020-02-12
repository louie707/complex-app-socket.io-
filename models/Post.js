const postCollection = require("../db").db().collection('posts')
const followCollection = require("../db").db().collection('follows')
const ObjectId = require('mongodb').ObjectId //allow to return objectId() this is a tool in mongoDB
const User = require('./user')
const sanitizeHTML = require("sanitize-html");


class Post {
    constructor(data, userId, postId) {
        this.data = data;
        this.userId = userId;
        this.errors = [];
        this.postId = postId;
    } 

    cleanUp() {
        if(typeof(this.data.title) !== "string") {this.data.title = ""}
        if(typeof(this.data.body) !== "string") {this.data.body = ""}

        this.data = {
            author: ObjectId(this.userId),
            title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
            body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
            dateCreated: new Date()
        }
    }

    validate() {
        if(!this.data.title) {this.errors.push("Please Enter title")}
        if(!this.data.body) {this.errors.push("Please Enter text in body")}
    }

    create() {
        return new Promise((resolve, reject) => {
            console.log(this.data)
            this.cleanUp()
            this.validate()
            
            if(!this.errors.length){
                postCollection.insertOne(this.data)
                .then((postData) => {
                    resolve(postData.ops[0]._id)
                })
                .catch(() => {
                    this.errors.push("Something went wrong on your data")
                    reject(this.errors)
                })
            } else {
                reject(this.errors)
            }

        })
    }

    actuallyUpdate() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp()
            this.validate()

            if(!this.errors.length){
                await postCollection.findOneAndUpdate({_id: new ObjectId(this.postId)}, {$set: {
                    title: this.data.title, 
                    body: this.data.body
                }}
                )
                resolve("success")
            } else{
                reject("failure")
            }
        })
    }

    update() {
        return new Promise(async (resolve, reject) => {
            try {
                let post = await Post.findSingleById(this.postId, this.userId)
                if(post.isVisitorOwner) {
                    let status = await this.actuallyUpdate()
                    resolve(status)
                } else {
                    reject()
                }
            } catch {
                reject()
            }
        })
    }
    
}

Post.reusablePostQuery = (uniqueOperations, visitorId) => {
    return new Promise(async (resolve, reject) => {
        let aggOperations = uniqueOperations.concat([
            {$lookup: {                       //$lookup = Performs a left outer join to an unsharded collection in the same database to filter in documents from the “joined” collection for processing.
                from: "users", 
                localField: "author", 
                foreignField: "_id", 
                as: "authorDocument"}
            },
            {$project: {                      //$project: = Passes along the documents with the requested fields to the next stage in the pipeline.
                title: 1,
                body: 1,
                dateCreated: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])
        
        let posts = await postCollection.aggregate(aggOperations).toArray()

        // clean up author property in each post object
        posts = posts.map((post) => {
            post.isVisitorOwner = post.authorId.equals(visitorId)
            post.authorId = undefined

            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts)
    })
}

Post.findSingleById = (id, visitorId) => {
    return new Promise(async (resolve, reject) => {
        if (typeof(id) != "string" || !ObjectId.isValid(id)){
            reject()
            return;
        }
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectId(id)}}
        ], visitorId)

        if (posts.length){
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.findByAuthorId = (authorId) => {
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {dateCreated: -1}}
    ])
}

Post.delete = (postId, visitorId) => {
    return new Promise(async (resolve, reject) => {
        let postDelete = await Post.findSingleById(postId, visitorId)
        if(postDelete.isVisitorOwner){
            await postCollection.deleteOne({_id: new ObjectId(postDelete._id)})
            resolve()
        } else {
            reject()
        }
    })

}

Post.search = (searchTerm) => {
    return new Promise(async (resolve, reject) => {
        if(typeof(searchTerm) == "string"){
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {sort: {$meta: "textScore"}}}
            ])
            resolve(posts)
        } else {
            reject()
        }
    })
}

Post.countPostByAuthorId = (authorId) => {
    return new Promise((resolve, reject) => {
        let totalPost = postCollection.countDocuments({author: authorId})
        resolve(totalPost)
    })
}

Post.getFeed = async (id) => {
    // create array of userId followed by the users
    let followedUsers = await followCollection.find({authorId: new ObjectId(id)}).toArray()
    followedUsers = followedUsers.map((followDoc) => {
        return followDoc.followedId
    })
    //  look for posts where the author is in the above array of followed users
    return Post.reusablePostQuery([
        {$match: {author: {$in: followedUsers}}},
        {$sort: {dateCreated: -1}}
    ])
}
module.exports = Post;