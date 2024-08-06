'use strict';

const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const ioClient = require('socket.io-client'); // Added for Socket.io client

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
    if (error) throw error;
    if (results[0].solution == 2) {
        console.log("Database connected and works");
    } else {
        console.error("There is something wrong with your database connection! Please check");
        process.exit(5);
    }
});

// Constants
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:3000/`;

// App
const app = express();

// Enable Cors
app.use(cors());

// Features for JSON Body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create Socket.io client connection
const socket = ioClient('http://socket-server-1:9090', {
    path: '/socket.io/',
    transports: ['websocket'],
    withCredentials: true
});

socket.on('connect', () => {
    console.log('Node.js server connected to Socket.io server');
});

socket.on('lockElement', (todoId) => {
    console.log('Received broadcast: lockElement for todoId:', todoId);
    // Handle lock element event
});

socket.on('unlockElement', (todoId) => {
    console.log('Received broadcast: unlockElement for todoId:', todoId);
    // Handle unlock element event
});

// Example emit to get locked todos
socket.emit('getLockedTodos');

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
});

// POST path for adding a new todo
app.post('/todo', (req, res) => {
    if (typeof req.body !== "undefined" && typeof req.body.title !== "undefined" && typeof req.body.description !== "undefined" && typeof req.body.category !== "undefined" && typeof req.body.dueDate !== "undefined") {
        let title = req.body.title;
        let description = req.body.description;
        let category = req.body.category;
        let dueDate = req.body.dueDate;
        console.log("Client send todo insert request with 'title': " + title + " ; description: " + description + " ; category: " + category + " ; dueDate: " + dueDate);
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
});

// POST path for adding a new category
app.post('/category', (req, res) => {
    if (typeof req.body !== "undefined" && typeof req.body.category !== "undefined") {
        let category = req.body.category;
        console.log("Client send category insert request with 'category': " + category);

        // First, check if the category already exists
        const checkQuery = "SELECT COUNT(*) as count FROM `category` WHERE `category_name` = ?";
        connection.query(checkQuery, [category], function (checkError, checkResults) {
            if (checkError) {
                console.error('Error checking category existence:', checkError);
                res.status(500).json(checkError);
                return;
            }

            if (checkResults[0].count > 0) {
                // If the category already exists, send an error message
                res.status(400).json({ message: 'Category already exists.' });
            } else {
                // If the category does not exist, insert it into the database
                const query = "INSERT INTO `category` (`category_name`) VALUES (?)";
                connection.query(query, [category], function (error, results, fields) {
                    if (error) {
                        console.error('Error inserting category:', error);
                        res.status(500).json(error);
                    } else {
                        console.log('Success answer: ', results);
                        res.status(200).json(results);
                    }
                });
            }
        });
    } else {
        console.error("Client send no correct data!");
        res.status(400).json({ message: 'This function requires a body with "category"' });
    }
});
// ###################### DATABASE PART END ######################

// All requests to /static/... will be redirected to static files in the folder "public"
// call it with: http://localhost:8080/static
app.use('/static', express.static('public'))

// Start the actual server
const expressServer = app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

// Start database connection
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
