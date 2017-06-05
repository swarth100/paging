exports.start = (server) => {
    /* Starts socket.io to be listening on the specific server */
    let io = require('socket.io').listen(server);

    /* Listens for 'connection' messages
     * 'connection' messages are issues by front-end socket-io.js via the io.connect() command */
    io.on('connection', function(socket) {
        socket.on('join', (data) => {
            socket.join(data);
            socket.emit('messages', 'thank you for joining');
        });
        socket.on('leave', (data) => {
            socket.leave(data);
        });
        socket.on('broadcast', (data) => {
            socket.broadcast.to(data.room).emit(data.eventName, data.data);
        });
    });
};