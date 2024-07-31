const express = require('express');
const socketIO = require('socket.io');
const { Redis } = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');

// Create and configure Redis clients
const pubClient = new Redis({
    host: 'redis',
    port: 6379
});
const subClient = pubClient.duplicate();

// Error handling for Redis clients
pubClient.on('error', (err) => {
    console.error('Redis pubClient error:', err);
});

subClient.on('error', (err) => {
    console.error('Redis subClient error:', err);
});

const app = express();

const PORT = process.env.PORT || 9090;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send('<h1>Socket.io service</h1>');
});

// Start the actual server
const expressServer = app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});

// Define SocketIO
const io = socketIO(expressServer, {
    adapter: createAdapter(pubClient, subClient),
    cors: {
        origin: '*',
    },
    path: "/socket.io/",
    methods: ["GET", "POST"],
    credentials: true
});

// Object to store which user has locked which todo
const lockedTodos = new Map();

io.on("connection", (socket) => {
    console.log(`A user connected with ID: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`A user disconnected with ID: ${socket.id}`);
        // Remove all locks held by this user when they disconnect
        lockedTodos.forEach((userId, todoId) => {
            if (userId === socket.id) {
                console.log(`User ${socket.id} released lock on todo ${todoId}`);
                lockedTodos.delete(todoId);
                socket.broadcast.emit('unlockElement', todoId);
            }
        });
    });

    socket.on("getLockedTodos", () => {
        console.log(`User ${socket.id} requested locked todos`);
        socket.emit('lockedTodos', Array.from(lockedTodos.keys()));
    });

    socket.on("editTodo", (todoId) => {
        console.log(`User ${socket.id} is locking todo ${todoId}`);
        // Save the lock
        lockedTodos.set(todoId, socket.id);
        // Notify other clients
        socket.broadcast.emit('lockElement', todoId);
    });

    socket.on("unlockTodo", (todoId) => {
        console.log(`User ${socket.id} is unlocking todo ${todoId}`);
        // Check if the current user has locked this todo
        if (lockedTodos.get(todoId) === socket.id) {
            // Remove the lock
            lockedTodos.delete(todoId);
            // Notify other clients
            socket.broadcast.emit('unlockElement', todoId);
        } else {
            console.log(`User ${socket.id} attempted to unlock todo ${todoId} but does not hold the lock`);
        }
    });
});
