'use strict';

const logDecorator = ($delegate, socket, $window) =>{

    if( typeof $window['onServer'] === 'undefined' ) {
        $delegate.dev = () => {};
        return $delegate;
    }

    var newLog = Object.create($delegate);
    newLog.prototype = $delegate.prototype;

    ['log', 'warn', 'info', 'error', 'debug'].forEach((item) =>{

        newLog[item] = function(...args) {
            const log = {
                type: item,
                args: args
            };
            socket.emit('LOG' , JSON.stringify(log));
        }

    });

    newLog['dev'] = function(...args: string[]) {

        if($window['serverDebug'] === true) {
            const log = {
                type: 'dev',
                args: args
            };
            if( $window.serverDebug === true && args[0] !== 'digest') {
                socket.emit('LOG', JSON.stringify(log));
            }
            else if (typeof $window.serverDebug.digest === 'boolean' && $window.serverDebug.digest === true) {
                socket.emit('LOG', JSON.stringify(log));
            }
        }
    };
    return newLog;
};

export default logDecorator;