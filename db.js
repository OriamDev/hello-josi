const mysql = require('mysql2')

const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "josi",
    charset: "utf8",
    multipleStatements: true,
});

db.connect((error) => {
    if (error) {
        console.log(error.message);
    } else {
        console.info("MySQL connected");
    }
});

module.exports = db;
