var express = require('express');
var router = express.Router();
var isLoggedIn = require('../middleware/routeprotectors').userIsLoggedIn;
var getRecentPosts = require('../middleware/postmiddleware').getRecentPosts;
var db = require("../config/database");

/* GET home page. */
// / -> localhost:3000
router.get('/', getRecentPosts, function(req, res, next) {
  //next(new Error('test'));
  res.render('index', {title:"PicPost"});
});

router.get('/login', (req, res, next) => {
  res.render('login', {title:"Log in"});
});

router.get('/registration', (req, res, next) => {
  res.render('registration', {title:"Register"});
});



router.get('/imagepost', (req, res, next) => {
  res.render('imagepost', {title:"Image Post"});
});

router.get('/searchresults', (req, res, next) => {
  res.render('searchresults', {title:"Search Results"});
});

// ensure user is logged in before they can post an image
router.use('/postimage', isLoggedIn);
router.get('/postimage', (req, res, next) => {
  res.render('postimage', {title:"Post an Image"});
});

// d+ thing ensures that id is a number so we don't break everything
router.get('/post/:id(\\d+)', (req, res, next) => {
  let baseSQL = "SELECT u.id, u.username, p.title, p.description, p.photopath, p.created \
  FROM users u \
  JOIN posts p \
  ON u.id = fk_userid \
  WHERE p.id = ?;";

  let postId = req.params.id;
  db.execute(baseSQL, [postId])
  .then(([results, fields]) => {
    if(results && results.length) {
      let post = results[0]; // title
      res.render('imagepost', {currentPost: post})
    }
    else {
      req.flash('error', 'This is not the post you are looking for :(');
      res.redirect('/');
    }
  })
})

module.exports = router;
