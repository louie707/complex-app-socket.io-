const bcrypt = require("bcryptjs")
const userCollection = require('../db').db().collection("users")
const validator = require("validator")
const md5 = require("md5")

class User {
    constructor(data, getAvatar) {
        this.data = data;
        this.errors = [];

        if(getAvatar == undefined) {getAvatar = false}
        if(getAvatar) {this.userAvatar()}
    }

    cleanUp() {
        if(typeof(this.data.username) != "string") {this.data.username = ""}
        if(typeof(this.data.email) != "string") {this.data.email = ""}
        if(typeof(this.data.password1) != "string") {this.data.password1 = ""}

        this.data = {
            username: this.data.username.trim().toLowerCase(),
            email: this.data.email.trim().toLowerCase(),
            password: this.data.password1
        }
    }

    validate() {
        return new Promise(async (resolve, reject) => {
            //check for blank inputs fields
            console.log(this.data)
            if(this.data.username == "") this.errors.push("Please Enter a username")
            if(this.data.email == "") this.errors.push("Please Enter a email")
            if(this.data.password1 == "" || this.data.password2 == "") this.errors.push("Please Enter a password")

            if(this.data.username && this.data.username.length < 3 || this.data.username.length > 15) this.errors.push("Username must contain 3 to 12 charcters only");
            if(this.data.email && !validator.isEmail(this.data.email)) this.errors.push("Please Enter a valid email")

            if(this.data.password1 !== this.data.password2) this.errors.push("Password don't match");

            //check for existing username
            if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
                let uniqUsername = await userCollection.findOne({username: this.data.username});
                if(uniqUsername) {this.errors.push("Username is taken")};
            }

            //check for existing emial
            if (validator.isEmail(this.data.email)){
                let uniqEmail = await userCollection.findOne({email: this.data.email});
                if(uniqEmail) {this.errors.push("Email is taken")};
            }
            resolve()
        })
    }

    login() {
        return new Promise((resolve, reject) => {
        
        this.cleanUp();
        console.log("login data", this.data)
        userCollection.findOne({username: this.data.username})
        //attemptedUser = value of promise or data from database if it match some and return true
        .then((attemptedUser) => {
            // compareSync = compare password in bcrypt form and default form and return true if it match compareSync(a = data in default form, b = data from database)
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                this.data = attemptedUser
                this.userAvatar()
                resolve("Success")
            } else {
                reject("Invalid username / password")
            }
        })
        .catch(() => reject("Please try again later"))

        })
        
    }
    
    register() {
        return new Promise(async (resolve, reject) => {
            await this.validate();
            this.cleanUp();

        if (!this.errors.length) {
            // hash user password
            let salt = bcrypt.genSaltSync(10);
            // update this.data.password value
            this.data.password = bcrypt.hashSync(this.data.password, salt);

            // add data to database
            userCollection.insertOne(this.data);
            this.userAvatar()
            resolve()
        } else {
            reject(this.errors)
        }
        })
    }

    userAvatar() {
        this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
    }
}

User.ifUSerExists = (username) => {
    return new Promise((resolve, reject) => {
        if(typeof(username) != "string"){
            reject()
        }
        userCollection.findOne({username: username}).then((userdata) => {
            if(userdata){
            userdata = new User(userdata, true)
            userdata = {
                _id: userdata.data._id,
                username: userdata.data.username,
                avatar: userdata.avatar
            }
            resolve(userdata)
        } else {
            reject()
        }
        }).catch(() => {
            reject()
        })
        
    })
}

User.ifEmailExists = (email) => {
    return new Promise((resolve, reject) => {
        if(typeof(email) != "string"){
            reject()
        }
        userCollection.findOne({email: email}).then((userdata) => {
            if(userdata){
            resolve(true)
        } else {
            reject(false)
        }
        }).catch(() => {
            reject(false)
        })
        
    })
}

module.exports = User;