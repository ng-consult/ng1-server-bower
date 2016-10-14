export interface IEngineQueue {
    isDone(): boolean,
    setStatus(name: string, value: boolean): void,
    addDependency(url: string, cacheId: string): void
}

export interface ICounter {
    incr():void,
    decr():void,
    triggerIdle(): void
}

export interface ICounterFactory {
    create(name:string, doneCB?:Function):ICounter,
    get(name: string): ICounter,
    incr(name:string):void,
    decr(name:string):void,
    getCount(name:string):number,
    touch(name:string):void
}
