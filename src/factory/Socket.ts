
interface IEmitQueue {
    key: string,
    value: any
}

interface IOnQueue {
    key: string,
    cb: Function
}


const SocketFactory = () => {

    let socket;
    const queueEmit: Array<IEmitQueue> = [];
    const queueOn: Array<IOnQueue> = [];
    let connected: boolean = false;

    const connect = (socketServer: string) => {
        console.log('connecting to socket server ', socketServer);

        socket = window['io'].connect(socketServer + '?token=' + window['serverConfig'].uid);

        socket.on('connect', () => {
            console.log('connected');
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
        //console.log('calling emit with key', key, socket);
        if( !connected) {
            queueEmit.push({key: key, value: value});
        } else {
            socket.emit(key, value);
        }
    };

    const on = (key: string, cb: Function) => {
        console.log('Received Event ', key);
        if( !connected) {
            queueOn.push({key: key, cb: cb});
        } else {
            socket.on(key, cb);
        }
    };

    return {
        connect: connect,
        emit: emit,
        on: on
    };
};

export default SocketFactory;

