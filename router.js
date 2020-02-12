const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

//profile related routes
router.get('/profile/:username', userController.ifUSerExists, userController.sharedProfileData, userController.profilePostScreen)
router.get('/profile/:username/followers', userController.ifUSerExists, userController.sharedProfileData, userController.profileFollowersScreen)
router.get('/profile/:username/following', userController.ifUSerExists, userController.sharedProfileData, userController.profileFollowingScreen)
router.post('/doesUsernameExist', userController.doesUsernameExist)
router.post('/doesEmailExist', userController.doesEmailExist)

router.get('/create-post', userController.mustBeLogIn, postController.viewCreateScreen)
router.post('/create-post', userController.mustBeLogIn, postController.create)
router.get('/post/:id', postController.viewSinglePost)
router.get('/post/:id/edit', userController.mustBeLogIn, postController.viewEditScreen)
router.post('/post/:id/edit', userController.mustBeLogIn, postController.edit)

router.post('/post/:id/delete', userController.mustBeLogIn, postController.delete)

router.post('/search', postController.search)

router.post('/addFollow/:username', userController.mustBeLogIn, followController.addFollow)
router.post('/removeFollow/:username', userController.mustBeLogIn, followController.removeFollow)
module.exports = router;