const express = require('express');
const socketIO = require('socket.io');
const app = express();

const PORT = process.env.PORT || 9090;
const HOST = process.env.HOST || '0.0.0.0';

app.get('/', (req, res) => {
  res.send('<h1>Socket.io service</h1>');
});

// Start the actual server
const expressServer = app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

// Define SocketIO
const io = socketIO(expressServer, {
    cors: {
        origin: '*',
    },
});

// Object to store which user has locked which todo
const lockedTodos = new Map();

io.on("connection", async (socket) => {
    console.log("A user connected", socket.id);

    // Send all currently locked todos to the newly connected client
    socket.emit('initializeLocks', Array.from(lockedTodos.keys()));

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        // Remove all locks held by this user when they disconnect
        lockedTodos.forEach((userId, todoId) => {
            if (userId === socket.id) {
                lockedTodos.delete(todoId);
                socket.broadcast.emit('unlockElement', todoId);
            }
        });
    });

    socket.on("editTodo", (todoId) => {
        // Save the lock
        lockedTodos.set(todoId, socket.id);
        // Notify other clients
        socket.broadcast.emit('lockElement', todoId);
    });

    socket.on("unlockTodo", (todoId) => {
        // Check if the current user has locked this todo
        if (lockedTodos.get(todoId) === socket.id) {
            // Remove the lock
            lockedTodos.delete(todoId);
            // Notify other clients
            socket.broadcast.emit('unlockElement', todoId);
        }
    });
});
