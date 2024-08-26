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

// Function to lock a todo
async function lockTodoInRedis(todoId, userId) {
    await pubClient.hset('lockedTodos', todoId, userId);
}

// Function to unlock a todo
async function unlockTodoInRedis(todoId, userId) {
    const currentUserId = await pubClient.hget('lockedTodos', todoId);
    if (currentUserId === userId) {
        await pubClient.hdel('lockedTodos', todoId);
        return true;
    }
    return false;
}

// Function to get all locked todos
async function getLockedTodosFromRedis() {
    const lockedTodos = await pubClient.hgetall('lockedTodos');
    return Object.keys(lockedTodos);
}

// Socket.IO events
io.on("connection", (socket) => {
    console.log(`A user connected with ID: ${socket.id}`);

    socket.on("disconnect", async () => {
        console.log(`A user disconnected with ID: ${socket.id}`);
        // Unlock all todos locked by this user
        const lockedTodos = await pubClient.hgetall('lockedTodos');
        for (const [todoId, userId] of Object.entries(lockedTodos)) {
            if (userId === socket.id) {
                console.log(`User ${socket.id} released lock on todo ${todoId}`);
                await unlockTodoInRedis(todoId, socket.id);
                socket.broadcast.emit('unlockElement', todoId);
            }
        }
    });

    socket.on("getLockedTodos", async () => {
        console.log(`User ${socket.id} requested locked todos`);
        const lockedTodos = await getLockedTodosFromRedis();
        socket.emit('lockedTodos', lockedTodos);
    });

    socket.on("editTodo", async (todoId) => {
        console.log(`User ${socket.id} is locking todo ${todoId}`);
        // Save the lock in Redis
        await lockTodoInRedis(todoId, socket.id);
        // Notify other clients
        socket.broadcast.emit('lockElement', todoId);
    });

    socket.on("unlockTodo", async (todoId) => {
        console.log(`User ${socket.id} is unlocking todo ${todoId}`);
        // Attempt to unlock the todo
        const unlocked = await unlockTodoInRedis(todoId, socket.id);
        if (unlocked) {
            // Notify other clients
            socket.broadcast.emit('unlockElement', todoId);
        } else {
            console.log(`User ${socket.id} attempted to unlock todo ${todoId} but does not hold the lock`);
        }
    });
});
