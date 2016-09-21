'use strict';

const logDecorator = ($delegate) =>{

    if(typeof window['onServer'] !== 'undefined' && window['onServer'] === true && typeof window['fs'] !== 'undefined' && typeof window['logConfig'] !== 'undefined') {

        let fs = window['fs'];
        let config = window['logConfig'];

        let formatMsg = (msg: string[]) => {
            let date = new Date();
            return date + " -> " + msg.join(' ') + '\n';
        };

        let log = (type:string, msg:string ) => {
            if (config[type].enabled) {
                if (config[type].stack === true) {
                    var err = new Error();
                    var stack = err['stack'];
                    msg += stack + '\n\n';
                }
                fs.appendFile(config.dir + '/' + type, msg, (err) => {
                    if (err) throw err;
                });
            }
        };

        var getArgs = ( ...args: any[]) => {
            var values = [];
            args.forEach(function(item) {
                if(typeof item === 'string' ) {
                    values.push(item);
                }
                else if( typeof item.toString === 'function') {
                    values.push(item.toString())
                }
            });
        };
        var timer = Date.now();
        var myLog = {
            formatMsg: formatMsg,
            warn: function (...args) {
                console.warn.apply(null, args);
                log('warn', formatMsg(args));
            },
            error: function (...args) {
                console.error.apply(null, args);
                log('error', formatMsg(args));
            },
            info: function (...args) {
                console.info.apply(null, args);
                log('info', formatMsg(args));
            },
            debug: function (...args) {
                console.debug.apply(null, args);
                log('debug', formatMsg(args));
            },
            log: function (...args) {
                console.log.apply(null, args);
                log('log', formatMsg(args));
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