'use strict';

const logDecorator = ($delegate, $window) =>{

    if(typeof window['onServer'] !== 'undefined' && window['onServer'] === true && typeof window['fs'] !== 'undefined' && typeof window['logConfig'] !== 'undefined') {

        let fs = window['fs'];
        let config = window['logConfig'];

        let formatMsg = (msg: string[]) => {
            let date = new Date();
            return date + " -> " + msg.join(' ') + '\n';
        };

        let log = (type:string, ...args ) => {

            if (config[type].enabled) {
                let msg = formatMsg(args);
                if (config[type].stack === true) {
                    var err = new Error();
                    var stack = err['stack'];
                    msg += stack + '\n\n';
                }
                fs.appendFile(config.dir + '/' + type, msg, (err) => {
                    if (err) throw err;
                });
            } else {
                $delegate[type].apply($window.console, args)
            }
        };

        var timer = Date.now();
        var myLog = {
            formatMsg: formatMsg,
            warn: function (...args) {
                //console.warn.apply(null, args);
                log('warn', args);
            },
            error: function (...args) {
                //console.error.apply(null, args);
                log('error', args);
            },
            info: function (...args) {
                //console.info.apply(null, args);
                log('info', args);
            },
            debug: function (...args) {
                //console.debug.apply(null, args);
                log('debug', args);
            },
            log: function (...args) {
                //console.log.apply(null, args);
                log('log', args);
            },
            dev: function(...args) {
                return;
                /*if(args[0] === 'digest') return;
                var time = Date.now() - timer;
                timer = Date.now();
                var name = args.shift();
                args.unshift(name + '+' + time);
                console.debug.apply(null, args);*/
            }
        };
        return myLog;
    } else {
        return $delegate;
    }
};

export default logDecorator;