import {IEngineQueue, ICounterFactory} from './../interfaces/definitions';

export default function CounterFactory(  $rootScope, $log, engineQueue: IEngineQueue,  TimeoutValue): ICounterFactory {
    const counters = {};

    /**
     *
     * @param name
     * @param doneCB
     * @returns {any}
     */
    const createCounter = (name: string, doneCB?:Function): Counter => {
        if(!doneCB) {
            doneCB = () => {};
        }
        counters[name] = new Counter(name, doneCB, $rootScope, engineQueue, TimeoutValue, $log);
        return counters[name];
    };

    const getCounter = (name: string): Counter => {
        return counters[name];
    };

    const incr = (name: string): void => {
        counters[name].incr();
    };

    const decr = (name: string): void => {
        counters[name].decr();
    };

    const getCount = (name:string): number => {
        return counters[name].getCount();
    };

    return {
        create: createCounter,
        incr: incr,
        decr: decr,
        getCount: getCount
    };
};

class Counter {
    private done:boolean;
    private timeout: any;
    private count: number;

    private timer = Date.now();

    constructor( private name: string, private doneCB:Function, private $rootScope, private engineQueue: IEngineQueue, private TimeoutValue: number, private $log) {
        this.done = false;
        this.count = 0;
        this.engineQueue.setStatus(this.name, false);
    }

    getCount = (): number => {
        return this.count;
    };

    isDone = (): boolean => {
        return this.done;
    };

    private clearTimeout = (): void => {
        if(typeof this.timeout !== 'undefined') {
            this.$log.dev(this.name, 'Timeout cleared', this.timeout);
            this.timeout = window.clearTimeout(this.timeout);
        }
    };

    incr = (): void => {
        if(this.done) { return;}
        this.count++;
        if(this.name !=='digest'){
            this.$log.dev(this.name, 'Incrementing counter ', this.count);
        }
        this.$log.dev(this.name, 'Incrementing counter ', this.count);
        this.engineQueue.setStatus(this.name, false);
        this.clearTimeout();
    };

    decr = (): void => {
        if(this.done) { return;}
        this.count--;
        if(this.name !=='digest'){
            this.$log.dev(this.name, 'Decrementing counter ',this.count);
        }
        this.engineQueue.setStatus(this.name, false);
        this.clearTimeout();
        if(this.count === 0) {
            this.triggerIdle();
        }
    };

    triggerIdle = (): void => {
        this.clearTimeout();
        this.$log.dev(this.name, 'triggerIdle called', this.count, this.TimeoutValue);
        this.timeout = window.setTimeout( function(){
            if(this.count === 0) {
                this.$log.dev(this.name, 'setting the doneVar to true', this.count);
                this.engineQueue.setStatus(this.name, true);
                if(this.engineQueue.isDone()) {
                    this.done = true;
                    this.$log.dev(this.name, 'calling CB()');
                    this.doneCB();
                }
            } else {
                this.$log.dev(this.name, 'triggerIdle cancelled ', this.count);
                this.engineQueue.setStatus(this.name, false);
            }
        }.bind(this), this.TimeoutValue);
        this.$log.dev(this.name, 'timeout set to', this.timeout);
    };
}

