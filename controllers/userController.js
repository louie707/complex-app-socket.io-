const User = require("../models/user")
const Post = require("../models/Post")
const Follow = require("../models/Follow")
const jwt = require("jsonwebtoken")

exports.mustBeLogIn = (req, res, next) => {
    if(req.session.user){
        next()
    } else {
        //flash(a,b) a = name of array; b = message to value
        req.flash("errors", "You munst be logged In")
        req.session.save(() => res.redirect("/"))
    }
}

exports.doesUsernameExist = (req, res) => {
    User.ifUSerExists(req.body.username).then(() => {
        res.json(true)
    }).catch(() => res.json(false) )
}

exports.doesEmailExist = (req, res) => {
    User.ifEmailExists(req.body.email).then(() => {
        res.json(true)
    }).catch(() => res.json(false) )
}

exports.home = async (req, res) => {
    if (req.session.user) {
        let posts = await Post.getFeed(req.session.user._id)
        console.log(posts)
        res.render("home-dashboard", {posts: posts})
    } else {
        res.render("home-guest", {regErrors: req.flash('regErrors')})
    }
}

exports.login = (req, res) => {
    let user = new User(req.body)
    user.login()
    .then((result) => {
        //session.user: "user" the name of the session that handle data
        req.session.user = {_id: user.data._id, username: user.data.username, avatar: user.avatar}
        console.log("session value", req.session.user)
        console.log("result", result)
        // req.session.save() = manually session to save
        req.session.save(() => {
            res.redirect("/")
        })
    })
    .catch((err) => {
        req.flash("errors", err)

        // req.session.save() = manually session to save
        req.session.save(() => res.redirect("/"))
    })
}

exports.logout = (req,res) => {
    req.session.destroy(() => {
        res.redirect('/')
    });
}

exports.register = (req, res) => {
    let user = new User(req.body)
    user.register()
    .then(() => {
        console.log("avatar", user.avatar)
        req.session.user = {_id: user.data._id, username: user.data.username, avatar: user.avatar}
        req.session.save(() => res.redirect("/"))
    })
    .catch(() => {
        user.errors.forEach((error) => {
            req.flash("regErrors", error)
        })
        req.session.save(() => res.redirect("/"))
    });
}

exports.ifUSerExists = (req, res, next) => {
    User.ifUSerExists(req.params.username).then((userdata) => {
        req.profileUser = userdata
        next()
    }).catch(() => {
        res.render("404")
    })
}

exports.sharedProfileData = async (req, res, next) => {
    let isVisitorProfile = false
    let isFollowing = false
    if(req.session.user){
        isVisitorProfile = req.profileUser._id.equals(req.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    }
    req.isVisitorProfile = isVisitorProfile
    req.isFollowing = isFollowing

    // get post, follower, following count
    let postCountPromise = Post.countPostByAuthorId(req.profileUser._id)
    let followerCountPromise = Follow.countFollowerById(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id)

    // example of array destructuring
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount
    next()
}

exports.profilePostScreen = (req , res) => {
Post.findByAuthorId(req.profileUser._id).then((posts) => {
    res.render('profile', {
        currentPage: "posts",
        posts: posts,
        avatar: req.profileUser.avatar,
        username: req.profileUser.username,
        isFollowing: req.isFollowing,
        isVisitorProfile: req.isVisitorProfile,
        count: {totalPost: req.postCount, totalFollower: req.followerCount, totalFollowing: req.followingCount}
        })
}).catch(() => {
    res.render("404")
})
}

exports.profileFollowersScreen = async (req, res) => {
    try{
        let followers = await Follow.getFollowersById(req.profileUser._id)
        console.log("safF", followers)
        res.render('profile-follower', { 
            currentPage: "follow",
            followers: followers,
            avatar: req.profileUser.avatar,
            username: req.profileUser.username,
            isFollowing: req.isFollowing,
            isVisitorProfile: req.isVisitorProfile,
            count: {totalPost: req.postCount, totalFollower: req.followerCount, totalFollowing: req.followingCount}
        })
    } catch {
        res.render('404')
    }
}

exports.profileFollowingScreen = async (req, res) => {
    try{
        let following = await Follow.getFollowingById(req.profileUser._id)
        console.log("safF", following)
        res.render('profile-followings', { 
            currentPage: "following",
            following: following,
            avatar: req.profileUser.avatar,
            username: req.profileUser.username,
            isFollowing: req.isFollowing,
            isVisitorProfile: req.isVisitorProfile,
            count: {totalPost: req.postCount, totalFollower: req.followerCount, totalFollowing: req.followingCount}
        })
    } catch {
        res.render('404')
    }
}

exports.apiLogin = (req, res) => {
    let user = new User(req.body)
    user.login()
    .then(function(result) {
        res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '7d'}))
    })
    .catch(function(err) {
        res.json("sorry that is incorrect")
    })
}

exports.apiMustBeLogIn = (req, res, next) => {
    try{
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
        next()
    } catch {
        res.json("Sorry token is not valid")
    }
}

exports.apiGetPostsByUsername = async (req, res) =>{
    try{
        let authorDoc = await User.ifUSerExists(req.params.username)
        let posts = await Post.findByAuthorId(authorDoc._id)
        res.json(posts)
    } catch {
        res.json("Sorry, invalid user request")
    }
}