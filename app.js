// app main file
const path = require("path");
const fs = require("fs");
// const https = require("https");

const express = require("express"); // hold Ctrl and hover mouse for detailed info
const session = require("express-session"); // import express-session package
const MongoDBStore = require("connect-mongodb-session")(session); // import sessions store
const csrf = require("csurf"); // import csrf package
const flash = require("connect-flash"); // import flash package
const bodyParser = require("body-parser"); // imports parser
const mongoose = require("mongoose"); // import mongoose
const multer = require("multer"); // import multer
const helmet = require("helmet"); // secure headers package
const compression = require("compression"); // compression package
const morgan = require("morgan"); // logging package

const app = express(); // initial new object to store and manage express behind the scenes
const errorController = require("./controllers/error"); // import controller
const shopController = require("./controllers/shop"); // import controller
const isAuth = require("./middleware/is-auth"); // import middleware route protection
const User = require("./models/user"); // import User model

// console.log(process.env.NODE_ENV);
// console.log(process.env.MONGO_USER);
// console.log(process.env.MONGO_PASSWORD);
// console.log(process.env.MONGO_DEFAULT_DATABASE);

// mongoDB entry point: 'mongodb+srv://username:password@cluster0-annvu.mongodb.net/shop?retryWrites=true'
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-annvu.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true`;
// initialize store
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions"
});
// initialize csrf middleware(default settings should work fine)
const csrfProtection = csrf();
// SSL/TLS certification
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");
// init filestorage configuration
// .diskStorage() multer method that takes 2 params destination & filename
// new Date().toISOString() - is used  here for unique name definition
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const uniqueKey = new Date().toISOString().split(".");
    // new Date().toISOString().replace(/:/g, '-')
    // cb(null, uniqueKey + '-' + file.originalname);
    cb(null, `${uniqueKey[1]}_${file.originalname}`);
  }
});
// init filefilter config
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
// set global configuration app.set(name, value);
app.set("view engine", "ejs"); // TE set
app.set("views", "./views"); // views(HTML) folder set

// import routes Data
const adminRoutes = require("./routes/admin.js");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
// flags: 'a' - means append new logs to the end of the file, not rewrite existing.
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

// headers secure middleware
app.use(helmet());
// compression middleware
app.use(compression());
// logging middleware
app.use(morgan("combined", { stream: accessLogStream }));
// register a middleware for req.body parser (parse - розбір)
// parsing data (розбір інформаційних данних)
app.use(bodyParser.urlencoded({ extended: false })); // it will return .next() in the end
// register multer middleware
// .single() multer method if we expect one file. it takes input field name as argument.
// .array() for array of files
// multer({dest: 'images'}) - sets destination folder for file upload
// multer({ storage: fileStorage }) - storage configuration
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
// register another middleware to grant access
// read access to the 'public' folder and forward any search file requests to it
app.use(express.static(path.join(__dirname, "public")));
// add middleware for uploaded images serving
// if we have a request that goes for '/images', then serve files from 'images' folder
app.use("/images", express.static(path.join(__dirname, "images")));
// register session middleware
app.use(
  session({
    secret: "hasToBeAVeryLongString",
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

// initialize(register) flash middleware
app.use(flash());

// special feature provided by express.js for every rendered view
// for adding isAuthtenticated and csrfToken data
// important to be used before routes middleware
// .locals give us an opportunity to add local data to every response
// which will be rendered
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

// assign new middleware for logged user
app.use((req, res, next) => {
  // throw new Error('Sycnc dummy error test')
  // session checkout
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then(user => {
      // throw new Error('Asycnc dummy error test')
      if (!user) {
        // if no user found
        return next();
      }
      // user here we get is a mongoose model object with all provided methods
      req.user = user;
      next(); // continue NodeJS event loop
    })
    .catch(err => {
      // pro way
      next(new Error(err));

      // alternative way
      // next();

      // bad choise
      // console.log(err);
    });
});

// routes order matters!!!
// '/create-order' provided by stripe servers already has it's own protection
// that's why it situated upon csrf
app.post("/create-order", isAuth, shopController.postOrder);
// important to use csrf protection after session bcs it uses session by default
app.use(csrfProtection);
// special feature provided by express.js for every rendered view
// for adding isAuthtenticated and csrfToken data
// important to be used before routes middleware
// .locals give us an opportunity to add local data to every response
// which will be rendered
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
// only routes that start with '/admin' will use adminRoutes object logic
app.use("/admin", adminRoutes);
app.use(shopRoutes); // allow express app consider shopRoutes object and use it logic
app.use(authRoutes); // allow express app consider authRoutes object and use it logic

// 500 error handle
app.use("/500", errorController.get500);
// 404 error handle
app.use(errorController.get404);
// special express error handling middleware
// if you have more then one error handling middlewares
// they will be executed in order from top to bottom as normal middlewares
app.use((error, req, res, next) => {
  console.log(error);
  const message = error.toString();
  // const message = error.errmsg.split(': ')[0];
  // const message = error.errmsg;
  // res.status(error.httpStatusCode).render(...)
  // res.redirect('/500');
  // console.log(message);
  res.status(500).render("500", {
    status: res.statusCode,
    docTitle: "System error",
    path: "/500",
    errorMessage: message,
    isAuthenticated: req.session.isLoggedIn
  });
});

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(result => {
    app.listen(process.env.PORT || 3000);
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(process.env.PORT || 3000);  
  })
  .catch(err => console.log(err));
