const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./utils/users');



const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder            // current directory, folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
    // console.log('New Web Socket Connection..');

    // Add the user to chat room
    socket.on('joinRoom', ({ username, room }) => {

        // Get the user.. 
        const user = userJoin(socket.id, username, room);

        // Join to the room..
        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

        // Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit('message',
                formatMessage(botName, `A ${user.username} has joined the chat`)
            );

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })


    })

    // Listen for chatMessage
    socket.on('chatMessage', msgCaptured => {

        const user = getCurrentUser(socket.id);

        // console.log(msgCaptured);
        io.to(user.room).emit('message', formatMessage(user.username, msgCaptured));
    })

    // Runs when client disconnects
    socket.on('disconnect', () => {

        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`)
            );

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }


    });
});




const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});