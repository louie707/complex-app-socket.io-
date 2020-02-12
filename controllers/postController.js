const Post = require('../models/Post')

exports.viewCreateScreen = (req, res) => {
    if(req.session.user){
        res.render("create-post")
    } else {
        res.send("Nah boy")
    }
}

exports.create = (req, res) => {
    let post = new Post(req.body, req.session.user._id)
    post.create()
    .then((postData) => {
        req.flash("success","New Post added")
        req.session.save(() => {
        res.redirect(`/post/${postData}`)
        })
    })
    .catch((error) => {res.send(error)});
}

exports.viewSinglePost = async (req, res) => {
    try {
        //Route parameters are named URL segments that are used to capture the values specified at their position in the URL.
        //example /getUser/:id
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render("single-post-screen", {post: post})
    } catch {
        res.render("404")
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {
        res.render("edit-post", {post: post})
    } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
    }
    } catch {
    res.render("404")
    }
}

exports.edit = (req, res) => {
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update().then((status) => {
        if (status){
            req.flash("success", "Post Updated")
            req.session.save(() => {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        } else {
            post.errors.forEach((error) => {
                req.flash("errors", error)
            })
            req.session.save(() => {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    })
    .catch(() => {
        // a post with the requested id doesnt exist
        // or if the current visitor is not the owner of the post
        req.flash("errors", "You do not have permission to perform this request")
        req.session.save(() => {
            res.redirect("/")
        })
    })
}

exports.delete = (req, res) => {
    Post.delete(req.params.id, req.visitorId)
    .then(() => {
        req.flash("success", "Deleted Successfully")
        req.session.save(() => {
            res.redirect(`/profile/${req.session.user.username}`)
        })
    })
    .catch(() => {
        req.flash("errors", "You do not have permission to perform this request")
        req.session.save(() => {
            res.redirect(`/profile/${req.session.user.username}`)
        })
    })

}

exports.search = (req, res) => {
    Post.search(req.body.searchTerm).then(posts => {
        res.json(posts)
    }).catch()
}

exports.apiCreate = (req, res) => {
    console.log("apiUserId",req.apiUser._id)
    let post = new Post(req.body, req.apiUser._id)
    // console.log("apiUser",req.apiUser._id)
    post.create()
    .then((postData) => {
        res.json("Congrats")
    })
    .catch((errors) => {
        res.json(errors)
    });
}

exports.apiDelete = (req, res) => {
    Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
        res.json("deleted")
    })
    .catch((error) => {
        res.json(error)
    })

}