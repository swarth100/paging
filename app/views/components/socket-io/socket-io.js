/* Creates factory for socket
 * Since we are inject the code into angular app, we can call the socket inside parameter
 * eg. connect is an event which is fired upon a successful connection
 *     socket.on('connect', (data) => {
 *         socket.emit('hello', 'Hello world');
 *     });
 */
app.factory('socket', function($rootScope) {
    let socket = io.connect();
    return {
        on: (eventName, func) => {
            socket.on(eventName, func);
        },
        emit: (eventName, data) => {
            socket.emit(eventName, data);
        },
        join: (room) => {
            socket.emit('join', room);
        },
        leave: (room) => {
            socket.emit('leave', room);
        },
        broadcast: (room, eventName, data) => {
            socket.emit('broadcast', {'room': room, 'eventName': eventName, 'data': data});
        },
    };
});