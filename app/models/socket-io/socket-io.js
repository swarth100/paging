
let mongooseRoom = require('../mongoose/rooms');

exports.start = (server) => {
    /* Starts socket.io to be listening on the specific server */
    let io = require('socket.io').listen(server);

    /* Listens for 'connection' messages
     * 'connection' messages are issues by front-end socket-io.js via the io.connect() command */
    io.on('connection', function(socket) {
        socket.on('join', (roomID) => {
            socket.join(roomID);

            socket.emit('messages', 'thank you for joining ' + roomID);

            /* Looks into the database to find an object corresponding to the given roomID */
            let findPromise = mongooseRoom.find({'id': roomID});
            findPromise
                .then(function(room) {
                    /* Room already exists in the DB */
                    console.log('Room already exists and found');
                })
                .catch(function(err) {
                    /* Room must be created in the DB */
                    console.log('New room has been created');

                    /* Room must be created and saved into the DB */
                    let room = mongooseRoom.createNewRoom(roomID);
                    let savePromise = mongooseRoom.saveRoom(room);
                    savePromise
                        .then(function(room) {
                            /* Room has been saved into the DB with success */
                            console.log('Saved with success.');
                        })
                        .catch(function(err) {
                            /* An unexpected error occurred while saving the room */
                            console.log('Error occurred while saving to the database');
                        });
                });
        });
        socket.on('leave', (data) => {
            socket.leave(data);
        });
        socket.on('broadcast', (data) => {
            /* Add backend catch for location posting */
            if (data.eventName === 'location') {
                console.log('Location has been broadcast');
            }

            /* Add backend catch for messages being posted via the socket */
            if (data.eventName === 'messages') {
                console.log('Message has been sent');
            }

            socket.broadcast.to(data.room).emit(data.eventName, data.data);
        });
    });
};