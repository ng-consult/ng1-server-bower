'use strict';

import {IServerConfig, ISocket} from './../interfaces/definitions';

const logDecorator = ($delegate, socket: ISocket, serverConfigHelper: IServerConfig) =>{

    serverConfigHelper.init();

    var newLog = Object.create($delegate);
    newLog.prototype = $delegate.prototype;

    ['log', 'warn', 'info', 'error', 'debug'].forEach((item) =>{

        if(serverConfigHelper.onServer()) {
            newLog[item] = function(...args) {
                const log = {
                    type: item,
                    args: args
                };
                socket.emit('LOG' , log);
            }
        } else {
            newLog[item] = $delegate[item];
        }

    });

    if(serverConfigHelper.getDebug() === true) {
        let timer = Date.now();

        const devLog = (...args) => {
            let time = Date.now() - timer;
            timer = Date.now();
            let name = args.shift();
            args.unshift(name + '+' + time + 'ms ');
            return args;
        };

        newLog['dev'] = function (...args:string[]) {
            if (serverConfigHelper.onServer()) {
                newLog.dev = function (...args) {
                    const log = {
                        type: 'trace',
                        args: devLog(args)
                    };
                    //console.log('emitting LOG with ', JSON.stringify(log));
                    socket.emit('LOG', log);
                }
            } else {
                newLog.dev = function(...args: string[]) {
                    return $delegate.debug.apply(null, devLog(args));
                }
            }

        }
    } else {
        newLog['dev'] = () => {}
    }
    return newLog;
};

export default logDecorator;