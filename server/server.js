'use strict';

const express = require('express');
const cors = require('cors');
const socketIO = require('socket.io');

// Database
const mysql = require('mysql');
// Database connection info - used from environment variables
var dbInfo = {
    connectionLimit: 10,
    host: process.env.MYSQL_HOSTNAME,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};

var connection = mysql.createPool(dbInfo);
console.log("Connecting to database...");

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
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:3000/`;

// App
const app = express();

// Enable Cors
app.use(cors());

// Features for JSON Body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ###################### DATABASE PART ######################
//GET path for table data
app.get('/database', (req, res) => {
    console.log("Request to load all entries from category");
    connection.query("SELECT * FROM `category` JOIN `todo` ON todo.category_id=category.category_id;", function (error, results, fields) {
        if (error) {
            console.error(error);
            res.status(500).json(error);
        } else {
            console.log('Success answer from DB');
            res.status(200).json(results);
        }
    });
});

//GET path for category table
app.get('/category', (req, res) => {
    console.log("Request to load all entries from category");
    connection.query("SELECT * FROM `category`;", function (error, results, fields) {
        if (error) {
            console.error(error);
            res.status(500).json(error);
        } else {
            console.log('Success answer from DB');
            res.status(200).json(results);
        }
    });
});

// GET path for todo table
app.get('/todotable', (req, res) => {
    console.log("Request to load all entries from todo");
    connection.query("SELECT * FROM `todo`;", function (error, results, fields) {
        if (error) {
            console.error(error);
            res.status(500).json(error);
        } else {
            console.log('Success answer from DB');
            res.status(200).json(results);
        }
    });
});

// DELETE path for todo table
app.delete('/todotable/:id', (req, res) => {
    let id = req.params.id;
    console.log("Request to delete Item: " + id);

    connection.query("DELETE FROM `todo` WHERE `todo`.`todo_id` = ?", [id], function (error, results, fields) {
        if (error) {
            console.error(error);
            res.status(500).json(error);
        } else {
            console.log('Success answer: ', results);
            res.status(200).json(results);
        }
    });
    io.emit('refreshTableData');
});

// POST path for adding a new task
app.post('/task', (req, res) => {
    if (typeof req.body !== "undefined" && typeof req.body.title !== "undefined" && typeof req.body.description !== "undefined" && typeof req.body.category !== "undefined" && typeof req.body.dueDate !== "undefined") {
        let title = req.body.title;
        let description = req.body.description;
        let category = req.body.category;
        let dueDate = req.body.dueDate;
        console.log("Client send task insert request with 'title': " + title + " ; description: " + description + " ; category: " + category + " ; dueDate: " + dueDate);
        const query = "INSERT INTO `todo` (`todo_title`, `todo_description`, `todo_due_date`, `category_id`) VALUES (?, ?, ?, (SELECT category_id FROM category WHERE category_name = ? LIMIT 1))";
        connection.query(query, [title, description, dueDate, category], function (error, results, fields) {
            if (error) {
                console.error(error);
                res.status(500).json(error);
            } else {
                console.log('Success answer: ', results);
                res.status(200).json(results);
            }
        });
    } else {
        console.error("Client send no correct data!")
        res.status(400).json({ message: 'This function requires a body with "title", "description", "category", and "dueDate"' });
    }
    io.emit('refreshTableData');
});

// POST path for adding a new category
app.post('/category', (req, res) => {
    if (typeof req.body !== "undefined" && typeof req.body.category !== "undefined") {
        let category = req.body.category;
        console.log("Client send category insert request with 'category': " + category);
        const query = "INSERT INTO `category` (`category_name`) VALUES (?)";
        connection.query(query, [category], function (error, results, fields) {
            if (error) {
                console.error(error);
                res.status(500).json(error);
            } else {
                console.log('Success answer: ', results);
                res.status(200).json(results);
            }
        });
    } else {
        console.error("Client send no correct data!")
        res.status(400).json({ message: 'This function requires a body with "category"' });
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
