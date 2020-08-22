const express = require('express');
const router = express.Router();
const db = require('../config/database');

// fetch users
router.get('/getAllUsers', (req, res, next) => {
    //res.send('getting all posts');
    db.query('SELECT * FROM users;', (err, results, fields) => 
    {
        if (err) {
            next(err);
        }
            console.log(results);
            res.send(results);
    })
    
});

router.get('/getAllPosts', (req, res, next) => {
    //res.send('getting all posts');
    db.query('SELECT * FROM posts', (err, results, fields) => 
    {
            console.log(results);
            res.send(results);
    })
    
});


router.get('/getAllPostsP', (req, res, next) => {
    db.promise().query('SELECT * FROM posts;')
    .then(([results, fields]) => {
        console.log(results);
        res.send(results);
    })
    .catch((err) => {
        next(err);
    })
    
    
});

// access registration stuff from front end
router.post('/createUser', (req, res, next) => {
    console.log(req.body);
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    // validate data, if bad send back response
    // res.redirect('/registration'); - send back to registration page

    let baseSQL = 'INSERT INTO users (username, email, password, created) VALUES (?, ?, ?, now())';
    db.promise().query(baseSQL, [username, email, password]).
    then(([results, fields]) => {
        // if proper response received indicating that is was made
        if(results && results.affectedRows) {
            res.send('user made');
        }
        else {
            res.send('user not made :(');
        }
    })
})

module.exports = router;