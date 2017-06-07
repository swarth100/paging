/* Creates factory for socket
 * Since we are inject the code into angular app, we can call the socket inside parameter
 * eg. connect is an event which is fired upon a successful connection
 *     socket.on('connect', (data) => {
 *         socket.emit('hello', 'Hello world');
 *     });
 */
app.factory('socket', function($rootScope) {
    /* Connects to server
     * Issues a 'connect' message. Must be trapped by socket initialised by server */
    let socket = io.connect();

    /* Traps default socket.io functions emitting the relevant commands for nodeJS */
    return {
        on: (eventName, func) => {
            socket.once(eventName, func);
        },
        once: (eventName, func) => {
            socket.on(eventName, func);
        },
        removeAllListeners: (eventName, func) => {
            socket.removeAllListeners(eventName);
            func();
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