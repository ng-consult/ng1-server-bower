export interface IEngineQueue {
    isDone: Function,
    setStatus: Function
}


export interface ICounterFactory {
    create: Function,
    get: Function,
    incr: Function,
    decr: Function,
    getCount: Function,
    touch: Function
}
