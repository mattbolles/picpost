var express = require('express');
const { successPrint, errorPrint } = require('../helpers/debug/debugprinters');
const { red } = require('colors');
var router = express.Router();
var db = require('../config/database');
const UserError = require('../helpers/error/UserError');
var bcrypt = require('bcrypt');
const {body, validationResult} = require('express-validator');


// localhost:3000/users
router.get('/', function(req, res, next) {
  res.render('index', {title:"PhotoApp"});
});



// user registration
router.post('/register', function(req, res, next) {
  //console.log(req.body);
  //res.send('data');
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;
  let confirmpassword = req.body.confirmpassword;

   // make sure username doesnt exist
   // make sure email doesnt exist

  // check if usernmae already exists
  db.execute("SELECT * FROM users WHERE username=?", [username]).then(
    ([results, fields]) => {
    if(results && results.length == 0) {
      // if username does not exist (no results), check if email exists
      return db.execute("SELECT * FROM users WHERE email=?", [email])
    }
    else {
      throw new UserError(
        "Registration failed: bcrypt failure.", // error msg
        "/registration", //redirect url
        200 // error codes
      );
    }
  })
  
  // if email does not already exist, then hash password
  .then(([results, fields]) => {
    if (results && results.length == 0) {
      return bcrypt.hash(password,10);
    }
    else {
      throw new UserError(
        "registration failed: email already exists",
        "/registration",
        200
      );
    }
  })

  // insert hashed password
  .then((hashedPassword) => {
    let baseSQL = "INSERT INTO users (username, email, password, created) VALUES (?,?,?,now());";
    return db.execute(baseSQL, [username, email, hashedPassword])
  })

  // check if user was succesfully created
  .then(([results, fields]) => {
    if(results && results.affectedRows ) {
      successPrint("User.js --> User was created!!");
      req.flash('success', 'User account has been created!');
      res.redirect('/login');
    }
    else {
      throw new UserError(
        "Server error, user could not be created",
        "/registration",
        500
      );
    }
  })
  .catch((err) => {
    errorPrint("user could not be made, internal error", err);
    if(err instanceof UserError) {
      errorPrint(err.getMessage()); // print to console
      req.flash('error', err.getMessage()); // print for user
      res.status(err.getStatus());
      res.redirect(err.getRedirectURL());
    }
    else {
      next(err);
    }
  });
});

// user login
router.post('/login', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;

  let baseSQL = "SELECT id, username, password FROM users WHERE username=?;"
  let userId;
  db.execute(baseSQL,[username])
  .then(([results,fields]) => {
    // successful login, redirect to home page
    if(results && results.length == 1) {
      // compare entered password with hashed password from db
      let hashedPassword = results[0].password;
      userId = results[0].id; // grab user id
      return bcrypt.compare(password, hashedPassword);
      
    }
    else {
      throw new UserError("1st statement: invalid username and/or password!", "/login", 200);
    }
  })
  // pass in bool value of whether they matched
  .then((passwordsMatched) => {
    if(passwordsMatched) {
      successPrint(`User ${username} is logged in`);
      req.session.username = username; // initialize session
      req.session.userId = userId;
      res.locals.logged = true; // keeps track of login
      req.flash('success', 'Successfully logged in!'); // print for user
      res.redirect('/'); // redirect after event, don't render
    }
    else {
      throw new UserError("2nd statement: Invalid username and/or password!", "/login", 200);
    }
  }) 
  .catch((err) => {
    errorPrint("user login failed");
    if(err instanceof UserError) {
      errorPrint(err.getMessage());
      res.status(err.getStatus());
      res.redirect('/login');
    }
    else {
      next(err);
    }
  })
})

// user logout
router.post('/logout', (req, res, next) => {
  // destroy session upon log out
  req.session.destroy((err) => {
    if(err) {
      errorPrint("session could not be destroyed");
      next(err);
    }
    else {
      successPrint('session was destroyed');
      res.clearCookie('csid');
      res.json({status:"OK", message:"user is logged out"});
    }
  })
});

module.exports = router;


