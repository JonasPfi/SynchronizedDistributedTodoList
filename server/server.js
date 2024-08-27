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

let lockedElements = {};

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

socket.on('lockDatabaseElement', (todoId, userId) => {
    if (lockedElements[todoId]) {
        console.log(`Element ${todoId} is already locked by user ${lockedElements[todoId]}.`);
    } else {
        lockedElements[todoId] = userId;
        console.log(`User ${userId} has locked element ${todoId}.`);
    }
});

socket.on('unlockDatabaseElement', (todoId, userId) => {
    // Check if the element is locked and if the unlocking user is the one who locked it
    if (lockedElements[todoId] === userId) {
        delete lockedElements[todoId];
        console.log(`User ${userId} has unlocked element ${todoId}.`);
    } else if (lockedElements[todoId]) {
        console.log(`Element ${todoId} is locked by user ${lockedElements[todoId]}. User ${userId} cannot unlock it.`);
    } else {
        console.log(`Element ${todoId} is not locked.`);
    }
});

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
// UPDATE path for todos
app.put('/todo', (req, res) => {
    if (req.body && req.body.todoId && req.body.type && req.body.content && req.body.userId) {
        let todoId = req.body.todoId;
        let type = req.body.type;
        let content = req.body.content;
        let userId = req.body.userId;

        // Check if the user holds the lock
        if (lockedElements[todoId] !== userId) {
            return res.status(403).json({ message: 'You do not have permission to update this item.' });
        }

        // Determine the column to update based on the type
        let columnToUpdate;
        if (type === 'title') {
            columnToUpdate = 'todo_title';
        } else if (type === 'description') {
            columnToUpdate = 'todo_description';
        } else {
            return res.status(400).json({ message: 'Invalid type provided. Use "title" or "description".' });
        }

        // SQL query to update the todo item
        let query = `
            UPDATE todo
            SET ${columnToUpdate} = ?
            WHERE todo_id = ?;
        `;

        // Execute the query
        connection.query(query, [content, todoId], (err, results) => {
            if (err) {
                console.error('Error updating todo:', err);
                res.status(500).json({ message: 'Error updating todo item.' });
            } else if (results.affectedRows === 0) {
                res.status(404).json({ message: 'Todo item not found.' });
            } else {
                res.status(200).json({ message: 'Todo item updated successfully.' });
            }
        });
    } else {
        console.error('Client sent incorrect data!');
        res.status(400).json({ message: 'This function requires a body with "todoId", "type", "content", and "userId".' });
    }
});

// UPDATE path for todo finished status
app.put('/todo/finished', (req, res) => {
    if (req.body && req.body.todoId && typeof req.body.completed !== 'undefined' && req.body.userId) {
        let todoId = req.body.todoId;
        let completed = req.body.completed ? 1 : 0;

        let query = `
            UPDATE todo
            SET todo_finished = ?
            WHERE todo_id = ?;
        `;

        connection.query(query, [completed, todoId], (err, results) => {
            if (err) {
                console.error('Error updating todo status:', err);
                res.status(500).json({ message: 'Error updating todo status.' });
            } else if (results.affectedRows === 0) {
                res.status(404).json({ message: 'Todo item not found.' });
            } else {
                res.status(200).json({ message: 'Todo status updated successfully.' });
            }
        });
    } else {
        res.status(400).json({ message: 'This function requires a body with "todoId", "completed", and "userId".' });
    }
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