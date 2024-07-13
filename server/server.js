'use strict';

const express = require('express');
const cors = require('cors');
const socketIO = require('socket.io');

// Database
const mysql = require('mysql');
// Database connection info - used from environment variables
var dbInfo = {
    connectionLimit : 10,
    host: process.env.MYSQL_HOSTNAME,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};

var connection = mysql.createPool(dbInfo);
console.log("Conecting to database...");
// connection.connect(); <- connect not required in connection pool

// SQL Database init.
// In this current demo, this is done by the "database.sql" file which is stored in the "db"-container (./db/).
// Alternative you could use the mariadb basic sample and do the following steps here:
/*
connection.query("CREATE TABLE IF NOT EXISTS table1 (task_id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)  ENGINE=INNODB;", function (error, results, fields) {
    if (error) throw error;
    console.log('Answer: ', results);
});
*/
// See readme.md for more information about that.

// Check the connection
connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    if (error) throw error; // <- this will throw the error and exit normally
    // check the solution - should be 2
    if (results[0].solution == 2) {
        // everything is fine with the database
        console.log("Database connected and works");
    } else {
        // connection is not fine - please check
        console.error("There is something wrong with your database connection! Please check");
        process.exit(5); // <- exit application with error code e.g. 5
    }
});

// Constants
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// App
const app = express();

// Enable Cors
app.use(cors());

// Features for JSON Body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ###################### DATABASE PART ######################
// GET path for database
app.get('/database', (req, res) => {
    console.log("Request to load all entries from table1");
    // Prepare the get query
    connection.query("SELECT * FROM `table1`;", function (error, results, fields) {
        if (error) {
            // we got an errror - inform the client
            console.error(error); // <- log error in server
            res.status(500).json(error); // <- send to client
        } else {
            // we got no error - send it to the client
            console.log('Success answer from DB: ', results); // <- log results in console
            // INFO: Here could be some code to modify the result
            res.status(200).json(results); // <- send it to client
        }
    });
});

// DELETE path for database
app.delete('/database/:id', (req, res) => {
    // This path will delete an entry. For example the path would look like DELETE '/database/5' -> This will delete number 5
    let id = req.params.id; // <- load the ID from the path
    console.log("Request to delete Item: " + id); // <- log for debugging

    // Actual executing the query to delete it from the server
    // Please keep in mind to secure this for SQL injection!
    connection.query("DELETE FROM `table1` WHERE `table1`.`task_id` = ?", [id], function (error, results, fields) {
        if (error) {
            // we got an errror - inform the client
            console.error(error); // <- log error in server
            res.status(500).json(error); // <- send to client
        } else {
            // Everything is fine with the query
            console.log('Success answer: ', results); // <- log results in console
            // INFO: Here can be some checks of modification of the result
            res.status(200).json(results); // <- send it to client
        }
    });
    io.emit('refreshTableData');
});

// POST path for database
app.post('/database', (req, res) => {
    // This will add a new row. So we're getting a JSON from the webbrowser which needs to be checked for correctness and later
    // it will be added to the database with a query.
    if (typeof req.body !== "undefined" && typeof req.body.title !== "undefined" && typeof req.body.description !== "undefined") {
        // The content looks good, so move on
        // Get the content to local variables:
        var title = req.body.title;
        var description = req.body.description;
        console.log("Client send database insert request with 'title': " + title + " ; description: " + description); // <- log to server
        // Actual executing the query. Please keep in mind that this is for learning and education.
        // In real production environment, this has to be secure for SQL injection!
        connection.query("INSERT INTO `table1` (`task_id`, `title`, `description`, `created_at`) VALUES (NULL, '" + title + "', '" + description + "', current_timestamp());", function (error, results, fields) {
            if (error) {
                // we got an errror - inform the client
                console.error(error); // <- log error in server
                res.status(500).json(error); // <- send to client
            } else {
                // Everything is fine with the query
                console.log('Success answer: ', results); // <- log results in console
                // INFO: Here can be some checks of modification of the result
                res.status(200).json(results); // <- send it to client
            }
        });
    }
    else {
        // There is nobody with a title nor description
        console.error("Client send no correct data!")
        // Set HTTP Status -> 400 is client error -> and send message
        res.status(400).json({ message: 'This function requries a body with "title" and "description' });
    }
    io.emit('refreshTableData');
});
// ###################### DATABASE PART END ######################


// All requests to /static/... will be redirected to static files in the folder "public"
// call it with: http://localhost:8080/static
app.use('/static', express.static('public'))

// Start the actual server
const expressServer = app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

// Define SocketIO
const io = socketIO(expressServer, {
    cors: {
        origin: '*',
    },
});

io.on("connection", async (socket) => {
    console.log("A user connected", socket.id);

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Start database connection
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}









