
let mongooseRoom = require('../mongoose/rooms');

exports.start = (server) => {
    /* Starts socket.io to be listening on the specific server */
    let io = require('socket.io').listen(server);

    /* Listens for 'connection' messages
     * 'connection' messages are issues by front-end socket-io.js via the
     * io.connect() command */
    io.on('connection', function(socket) {
        socket.on('join', (roomID) => {
            socket.room = roomID;
            socket.join(roomID);

            socket.emit('messages', 'thank you for joining ' + roomID);

            /* Looks into the database to find an object corresponding to
             the given roomID.
             * If a room is not found a new room is created.
             * If this fails as well, then a very serious error has occured
             * and the application should not be able to proceed.*/
            findRoom(roomID);
        });

        socket.on('leave', (data) => {
            socket.leave(data);
        });

        socket.on('location', (data) => {
            console.log('Location is being updated');
            findUserViaRoom(socket, data);
            socket.broadcast.to(socket.room).emit('update', data);
        });

        socket.on('broadcast', (data) => {
            /* Add backend catch for messages being posted via the socket */
            if (data.eventName === 'messages') {
                console.log('Message has been sent');
            }

            socket.broadcast.to(data.room).emit(data.eventName, data.data);
        });
    });

    function findRoom(roomID) {
        mongooseRoom.find({'id': roomID})
            .then(function(room) {
                /* Room already exists in the DB */
                console.log('Room already exists and found');
            })
            .catch(function(err) {
                /* Room must be created in the DB */
                console.log('New room has been created');

                /* Room must be created and saved into the DB */
                let room = mongooseRoom.createNewRoom(roomID);
                saveRoom(room);
            });
    }

    function saveRoom(room) {
        mongooseRoom.saveRoom(room)
            .then(function(room) {
                /* Room has been saved into the DB with success */
                console.log('Saved with success.');
            })
            .catch(function(err) {
                /* An unexpected error occurred while saving the room */
                console.log('Error occurred while saving to the database');
            });
    }

    function findUserViaRoom(socket, user) {
        mongooseRoom.find({'id': socket.room})
            .then(function(room) {
                /* Room already exists in the DB */
                console.log('Room found in the DB');

                /* Attempt to update the given user in the DB */
                updateUser(room, user);
            })
            .catch(function(err) {
                console.log('Room could not be found on DB');
            });
    }

    function updateUser(room, user) {
        mongooseRoom.updateUser(room, user)
            .then(function(room) {
                /* User was already present in the room. User's coords have been updated */
                console.log('Found user, updated values!');
            })
            .catch(function(err) {
                /* User is not present in the room */
                console.log('User not present in room. Create (and add) new user');
                addUser(room, user);
            });
    }

    function addUser(room, user) {
        /* Credits for random color generator:
         *  https://gist.github.com/samuelbeek/84721c03607ed5340f53
         *  */
        user.color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);

        /* Assign each user a random color before saving them */
        mongooseRoom.addUser(room, user)
            .then(function(room) {
                console.log('Saved new user with given values');
            })
            .catch(function(err) {
                console.log('Failed to save new user. Something went horribly wrong.');
            });
    }
};