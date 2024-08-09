import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();

const server = createServer(app);
const io = new Server(server);

// Handle __dirname in ES module.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Render the index.ejs file on the root route
app.get('/', (req, res) => {
    res.render('index');
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('User is connected');

    // Listen for 'send-location' event
    socket.on('send-location', (data) => {
        io.emit('location', { id: socket.id, ...data });
    });

    // Listen for 'disconnect' event
    socket.on('disconnect', () => {
        console.log('User is disconnected.');
        io.emit('user-disconnect', socket.id);
    });
});

// Start the server
server.listen(3000, () => {
    console.log(`Server is running at port 3000`);
});
