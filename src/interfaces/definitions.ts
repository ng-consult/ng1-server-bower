export interface IEngineQueue {
    isDone():boolean,
    setStatus(name:string, value:boolean):void,
    addDependency(url:string, cacheId:string):void
}

export interface ICounter {
    incr():void,
    decr():void,
    triggerIdle():void,
    touch(): void
}

export interface ICounterFactory {
    create(name:string, doneCB?:Function):ICounter,
    get(name:string):ICounter,
    incr(name:string):void,
    decr(name:string):void,
    getCount(name:string):number,
    touch(name:string):void
}

export interface IServerConfig {
    init(): void;
    hasRestCache(): boolean;
    getDebug(): boolean;
    setTimeoutValue(value:number):void ;
    getTimeoutValue():number;
    setRestServer(value:string):void;
    getRestCache():any;
    getRestServer():string;
    getRestCacheEnabled(): boolean;
    setDefaultHtpCache(value:boolean):void;
    getDefaultHttpCache():boolean;
    getUID():string;
    getSocketServer(): string;
    loadWindow(window: Window): void;
    onServer(): boolean;
}
 
export interface ISocket {
    init(): void;
    emit(name: string, data: Object):void;
    on(name: string, cb: Function): void;
}

export interface IEmitQueue {
    key: string,
    value: any
}

export interface IOnQueue {
    key: string,
    cb: Function
}
