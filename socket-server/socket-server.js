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

io.on("connection", async (socket) => {
    console.log("A user connected", socket.id);

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});