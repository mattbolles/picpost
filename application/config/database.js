const mysql = require('mysql2');

const pool = mysql.createPool ({
    host:"localhost",
    user:"root",
    password:"pass",
    database:"csc317db",
    connectionLimit: 500, 
    debug: false,
});

const promisePool = pool.promise();
module.exports = promisePool;