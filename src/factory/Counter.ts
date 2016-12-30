import {IEngineQueue, ICounterFactory, IServerConfig} from './../interfaces/definitions';


const CounterFactory = ($rootScope, $log, engineQueue:IEngineQueue, serverConfigHelper: IServerConfig):ICounterFactory => {
    serverConfigHelper.init();
    const counters = {};

    /*
    const start = () => {
        const httpCouter = createCounter('http');
        const qCounter = createCounter('q');
        const digestCounter = createCounter('digest', ()=> {
            $log.dev('run', 'digestWatcher cleanup', digestWatcher);
            digestWatcher();
        });

        $timeout(function () {
            $rootScope.$apply(() => {
                $log.dev('index.ts', 'touching http and q');
                httpCouter.touch();
                qCounter.touch();
            });

        }, serverConfigHelper.getTimeoutValue());

        var digestWatcher = $rootScope.$watch(() => {
            incr('digest');
            $rootScope.$$postDigest(function () {
                decr('digest');
            });
        });
    }*/
    /**
     *
     * @param name
     * @param doneCB
     * @returns {any}
     */
    const createCounter = (name:string, doneCB?:Function):Counter => {
        if (!doneCB) {
            doneCB = () => {
            };
        }
        if (typeof $rootScope.counters === 'undefined') {
            $rootScope.counters = {};
        }
        $rootScope.counters[name] = 0;
        $log.dev('counter', 'creating counter', name);
        if(typeof counters[name] !== 'undefined') {
            return counters[name];
        }
        counters[name] = new Counter(name, doneCB, $rootScope, engineQueue, serverConfigHelper.getTimeoutValue(), $log);
        return counters[name];
    };

    const incr = (name:string):void => {
        $rootScope.counters[name]++;
        counters[name].incr();
    };

    const decr = (name:string):void => {
        $rootScope.counters[name]--;
        counters[name].decr();
    };

    const getCount = (name:string):number => {
        return counters[name].getCount();
    };

    const touch = (name:string):void => {
        counters[name].touch();
    };

    const get = (name: string): Counter => {
        return counters[name];
    };

    return {
        create: createCounter,
        incr: incr,
        decr: decr,
        getCount: getCount,
        touch: touch,
        get: get
    };
};

class Counter {
    private done:boolean;
    private timeout:any;
    private count:number;
    private untouched:boolean = true;

    private timer = Date.now();

    constructor(private name:string, private doneCB:Function, private $rootScope, private engineQueue:IEngineQueue, private TimeoutValue:number, private $log) {
        this.done = false;
        this.count = 0;
        this.engineQueue.setStatus(this.name, false);
        $log.dev('counter', 'constructor called', this.name);
    }

    getCount = ():number => {
        return this.count;
    };

    isDone = ():boolean => {
        return this.done;
    };

    private clearTimeout = ():void => {
        if (typeof this.timeout !== 'undefined') {
            this.timeout = window.clearTimeout(this.timeout);
            this.$log.dev(this.name, 'Timeout cleared', this.timeout);
        }
    };

    touch = ():void => {
        this.$log.dev('Counter '+this.name, 'is getting touched');
        if(this.untouched === true) {
            this.$log.dev('Counter '+this.name, 'has been touched', this.untouched, this.getCount());
            this.engineQueue.setStatus(this.name, true);
            this.untouched  =false;
            this.triggerIdle();
        } else {
            this.$log.dev('Counter '+this.name, 'wont get touched', this.untouched, this.getCount());
        }
    };

    incr = ():void => {
        this.untouched = false;
        if (this.done) {
            return;
        }
        this.count++;
        this.$log.dev(this.name, 'Incrementing counter ', this.count);
        this.engineQueue.setStatus(this.name, false);
        this.clearTimeout();
    };

    decr = ():void => {
        if (this.done) {
            return;
        }
        this.count--;
        this.$log.dev(this.name, 'Decrementing counter ', this.count);
        this.engineQueue.setStatus(this.name, false);
        this.clearTimeout();
        if (this.count === 0) {
            this.triggerIdle();
        }
    };

    triggerIdle():void {
        this.clearTimeout();
        this.$log.dev(this.name, 'triggerIdle called', this.count, this.TimeoutValue);
        this.timeout = setTimeout( () => {
            if (this.count === 0) {
                this.$log.dev(this.name, 'setting the doneVar to true', this.count);
                this.engineQueue.setStatus(this.name, true);
                if (this.engineQueue.isDone()) {
                    this.done = true;
                    this.$log.dev(this.name, 'calling CB()');
                    this.doneCB();
                }
            } else {
                this.$log.dev(this.name, 'triggerIdle cancelled ', this.count);
                this.engineQueue.setStatus(this.name, false);
            }
        }, this.TimeoutValue);

        this.$log.dev(this.name, 'timeout set to', this.timeout);
    };
}

export default CounterFactory;