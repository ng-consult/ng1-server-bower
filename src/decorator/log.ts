'use strict';

const logDecorator = ($delegate, $window) =>{

    const isDef = name => { return angular.isDefined($window[name])};

    if(isDef('onServer') && isDef('fs') && isDef('logConfig') && $window['onServer'] === true) {} else {
        $delegate.dev = () => {}
        return $delegate;
    }

    const fs = $window['fs'];
    const config = $window['logConfig'];
    let timer = Date.now();

    let formatMsg = (...str) => {
        let date = new Date();
        return date + " -> " + str.join(' ') + '\n';
    };

    const devLog = (...args) => {
        let time = Date.now() - timer;
        timer = Date.now();
        let name = args.shift();
        args.unshift(name + '+' + time);
        fs.appendFile(config.dir + '/dev' , args.join(', ') + '\n', (err) => {
            if (err) throw err;
        });
        console.debug.apply(this, args);
    };

    var newLog = Object.create($delegate);
    newLog.prototype = $delegate.prototype;

    ['log', 'warn', 'info', 'error', 'debug'].forEach(function(item) {

        if (config[item].enabled) {
            newLog[item] = function(...args) {
                let msg = formatMsg.apply(this, args);

                if (config[item].stack === true) {
                    var err = new Error();
                    var stack = err['stack'];
                    msg += stack + '\n\n';
                }
                fs.appendFile(config.dir + '/' + item, msg, (err) => {
                    if (err) throw err;
                });
                return new Object();
            }
        } else {
            newLog[item] = $delegate[item];
        }
    });

    newLog['dev'] = function(...args: string[]) {
        if($window['serverDebug'] === true) {
            if( $window.serverDebug === true && args[0] !== 'digest') {
                devLog.apply(null, args);
            }
            else if (typeof $window.serverDebug.digest === 'boolean' && $window.serverDebug.digest === true) {
                devLog.apply(null, args);
            }
        }
    };

    return newLog;
};

export default logDecorator;