"use strict";
var SocketFactory = function () {
    var socket;
    var queueEmit = [];
    var queueOn = [];
    var connected = false;
    var connect = function (socketServer) {
        socket = window['io'].connect(socketServer + '?token=' + window['serverConfig'].uid);
        socket.on('connect', function () {
            console.log('DDD: connected to ', socketServer);
            connected = true;
            var elem;
            while (elem = queueEmit.shift()) {
                emit(elem.key, elem.value);
            }
            while (elem = queueOn.shift()) {
                on(elem.key, elem.cb);
            }
        });
        socket.on('connect_timeout', function (err) {
            console.log('connect_timeout', err);
        });
        socket.on('connect_error', function (err) {
            console.log('connect_error', err);
        });
    };
    var emit = function (key, value) {
        if (!connected) {
            queueEmit.push({ key: key, value: value });
        }
        else {
            socket.emit(key, value);
        }
    };
    var on = function (key, cb) {
        console.log('DDD: Received Event ', key);
        if (!connected) {
            queueOn.push({ key: key, cb: cb });
        }
        else {
            socket.on(key, cb);
        }
    };
    return {
        connect: connect,
        emit: emit,
        on: on
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SocketFactory;
