
import {IOnQueue, IEmitQueue, IServerConfig} from './../interfaces/definitions';

const SocketFactory = ($window: Window, serverConfig: IServerConfig) => {

    serverConfig.init();

    let socket;
    const queueEmit: Array<IEmitQueue> = [];
    const queueOn: Array<IOnQueue> = [];
    let connected: boolean = false;

    const init = () => {
        if (typeof $window['io'] !== 'undefined') {
            connect();
        } else {
            const script = $window.document.createElement('script');
            $window.document.head.appendChild(script);
            script.onload = () => {
                //console.log('IO SCRIPT LOADED', JSON.stringify($window.serverConfig.socketHostname + '/socket.io/socket.io.js'));
                if(typeof $window['io'] === 'undefined') {
                    throw new Error('It seems IO didnt load inside ngApp');
                }
                connect();
            };
            //console.log('Going to load script at ', serverConfig.getSocketServer() + '/socket.io/socket.io.js');
            script.src = serverConfig.getSocketServer() + '/socket.io/socket.io.js';
        }
    };

    const connect = () => {
        //console.log('connecting to socket server ', socketServer);

        //console.log('GOing to connect to ', serverConfig.getSocketServer() + '?token=' + serverConfig.getUID());

        socket = window['io'].connect(serverConfig.getSocketServer() + '?token=' + serverConfig.getUID());

        socket.on('connect', () => {
            //console.log('DDD: connected to ', serverConfig.getSocketServer());
            connected = true;
            let elem;
            while(elem = queueEmit.shift()) {
                emit(elem.key, elem.value);
            }
            while(elem = queueOn.shift()) {
                on(elem.key, elem.cb);
            }
        });

        socket.on('connect_timeout', function(err) {
            console.log('connect_timeout', err);
        });

        socket.on('connect_error', function(err) {
            console.log('connect_error', err);
        });

    };

    const emit = (key: string, value) => {
        value = Object.assign({}, {uid: serverConfig.getUID()}, value);
        if( !connected) {
            queueEmit.push({key: key, value: value});
        } else {
            socket.emit(key, value);
        }
    };

    const on = (key: string, cb: Function) => {
        if( !connected) {
            queueOn.push({key: key, cb: cb});
        } else {
            socket.on(key, cb);
        }
    };

    return {
        init: init,
        emit: emit,
        on: on
    };
};

export default SocketFactory;

