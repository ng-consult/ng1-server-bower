'use strict';
var logDecorator = function ($delegate, socket, $window) {
    if (typeof $window['onServer'] === 'undefined') {
        $delegate.dev = function () { };
        return $delegate;
    }
    var newLog = Object.create($delegate);
    newLog.prototype = $delegate.prototype;
    ['log', 'warn', 'info', 'error', 'debug'].forEach(function (item) {
        newLog[item] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var log = {
                type: item,
                args: args
            };
            socket.emit('LOG', JSON.stringify(log));
        };
    });
    newLog['dev'] = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if ($window['serverDebug'] === true) {
            var log = {
                type: 'dev',
                args: args
            };
            if ($window.serverDebug === true && args[0] !== 'digest') {
                socket.emit('LOG', JSON.stringify(log));
            }
            else if (typeof $window.serverDebug.digest === 'boolean' && $window.serverDebug.digest === true) {
                socket.emit('LOG', JSON.stringify(log));
            }
        }
    };
    return newLog;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = logDecorator;
