var express = require('express');
var router = express.Router();
var db = require('../config/database');
const UserError = require('../helpers/error/UserError');
var sharp = require('sharp');
var multer = require('multer');
var crypto = require('crypto');
var PostError = require('../helpers/error/PostError');

// set to save to folder
var storage = multer.diskStorage({
    destination:  function(req, file, cb){
        cb(null, "public/images/uploads"); // copy file to this path upon upload
    },
    filename: function(req, file, cb){
        let fileExt = file.mimetype.split('/')[1]; // get extension type
        let randomName = crypto.randomBytes(22).toString("hex"); // generate random file name for upload
        cb(null, `${randomName}.${fileExt}`);
    }
});

// create uploader, set to use local storage
var uploader = multer({storage: storage});


// uploading images
router.post('/createPost', uploader.single("uploadImage"), (req, res, next) => {
    let fileUploaded = req.file.path;
    let fileAsThumbnail = `thumbnail-${req.file.filename}`;
    let destinationOfThumbnail = req.file.destination + "/" + fileAsThumbnail;
    let title = req.body.title;
    let description = req.body.description;
    let fk_userId = req.session.userId;

    /** 
     * do server validation here
     * use express validation module?
     * make sure title, desc, fk_userid arent empty
     * if any values used for insert statement are undefined,
     * mysql.query or execute will fail with error:
     * BIND parameters cannot be undefined
     */
    sharp(fileUploaded).resize(200, 200) // resize to 200x200 to make thumbnail
    .toFile(destinationOfThumbnail)
    .then(() => {
        let baseSQL = 'INSERT INTO posts (title, description, photopath, thumbnail, created, fk_userid) VALUE (?,?,?,?, now(), ?);';
        return db.execute(baseSQL, [title, description, fileUploaded, destinationOfThumbnail, fk_userId]);
    })
    .then(([results, fields]) => {
        if(results && results.affectedRows) {
            req.flash('success', 'Your image has been successfully uploaded!');
            res.redirect('/'); // maybe redirect to new post later
        } 
        else {
            throw new PostError('Post could not be created!', '/postimage', 200)
        }
    })
    .catch(() => {
        if(err instanceof PostError) {
            errorPrint(err.getMessage());
            req.flash('error', err.getMessage());
            req.statusCode(err.getStatus());
            res.redirect(err.getRedirectURL());
        }
        else {
            next(err);
        }
    })
});

// localhost:3000/posts/search?search=value
router.get('/search/', (req, res, next) => {
    let searchTerm = req.query.search;
    if(!searchTerm) { // if no search term entered
        res.send({
            resultsStatus: "info",
            message: "No search term given",
            results: []
        });
    }
    else {
        let baseSQL = "SELECT id, title, description, thumbnail, concat_ws(' ', title, description) AS haystack \
        FROM posts \
        HAVING title like ?;"
        let sqlReadySearchTerm = "%" + searchTerm + "%"; // building proper search term
        db.execute(baseSQL, [sqlReadySearchTerm])
        .then(([results, fields]) => {
            if(results && results.length) {
                res.send({
                    resultsStatus:"info",
                    message: `${results.length} results found`,
                    results: results
                });
            }
            else {
                db.query('select id, title, description, thumbnail, created from posts ORDER BY created LIMIT 9', [])
                .then(([results, fields]) => {
                    res.send({
                        resultsStatus: "info",
                        message: "No results found for your search :( here are the 9 most recent posts",
                        results: results
                    })
                })
            }
        })
        .catch((err) => next(err));
    }
})

module.exports = router;