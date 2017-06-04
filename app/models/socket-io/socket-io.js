exports.start = (server) => {
    let io = require('socket.io').listen(server);
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