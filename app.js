const express = require("express");
const session = require("express-session")//allow to use sessions
const MongoStore = require("connect-mongo")(session) // (session)= refers to express-sesion package
const flash = require("connect-flash")//use for flashing notes example error in the UI
const markdown = require("marked") // allow to read br,bold etc in UI and save in database 
const app = express();
const csrf = require("csurf")// use to avoid cross site request forgery
const sanitizeHTML = require("sanitize-html")// filter tags, attribute that can harm database
const router = require('./router')//console.log(router) // router = file name of the required file(./router)

app.use(express.urlencoded({extended: false})) // get data in inputs feilds
app.use(express.json())

app.use('/api', require('./router-api'))

//boileplate for session
let sessionOntions = session({
    secret: "I watch",
    //store = by default it store data in memory but can overwrite by manually adding store value
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOntions)
app.use(flash())

// res.locals it turns out that setting locals variable should be done after initializing passport. Order of middle wear matters.
app.use((req, res, next) => {
    console.log(req.session.flash)
    //
    res.locals.filterUserHTML = (content) => {
        return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'strong', 'ol', 'ul', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']})
    }

    // make all error and success flash message available from all templates
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")


    //make current userId available in current req object
    if(req.session.user){
        req.visitorId = req.session.user._id
    } else {
        req.visitorId = 0
    }

    //make user session data vailable form within view template
    res.locals.user = req.session.user
    next()
})

//('views', 'views') = second parameter is the folder name
app.set('views', 'views');

//set view engine to use
//ejs =  example of template engine like handlebars etc.
app.set('view engine', 'ejs');

// use to read sub folder
app.use(express.static('public'));

app.use(csrf())

// make csrf available in html templates
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', router)

app.use((err, req, res, next) => {
    if(err) {
        if(err.code == "EBADCSRFTOKEN") {
            req.flash('errors', "Cross site request forgery detected")
            req.session.save(() => res.redirect("/"))
        } else {
            res.render("404")
        }
    }
})

const server = require('http').createServer(app)

const io = require('socket.io')(server)

io.use((socket, next) => {
    sessionOntions(socket.request, socket.request.res, next)
})

// socket variable represent connection between browser and server
io.on('connection', (socket) => {
    if(socket.request.session.user) {
        let user = socket.request.session.user
        socket.emit('welcome', {username: user.username, avatar: user.avatar})
        socket.on('chatMessageFromBrowser', (data) => {
            socket.broadcast.emit('chatMessageFromServer', {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar})
        })
    }
})

module.exports = server;