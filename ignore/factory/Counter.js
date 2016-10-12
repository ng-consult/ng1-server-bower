"use strict";
var CounterFactory = function ($rootScope, $log, engineQueue, timeoutValue) {
    var counters = {};
    var createCounter = function (name, doneCB) {
        if (!doneCB) {
            doneCB = function () {
            };
        }
        if (typeof $rootScope.counters === 'undefined') {
            $rootScope.counters = {};
        }
        $rootScope.counters[name] = 0;
        $log.dev('counter', 'creating counter', name);
        if (typeof counters[name] !== 'undefined') {
            return counters[name];
        }
        counters[name] = new Counter(name, doneCB, $rootScope, engineQueue, timeoutValue.get(), $log);
        return counters[name];
    };
    var incr = function (name) {
        $rootScope.counters[name]++;
        counters[name].incr();
    };
    var decr = function (name) {
        $rootScope.counters[name]--;
        counters[name].decr();
    };
    var getCount = function (name) {
        return counters[name].getCount();
    };
    var touch = function (name) {
        counters[name].touch();
    };
    var get = function (name) {
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
var Counter = (function () {
    function Counter(name, doneCB, $rootScope, engineQueue, TimeoutValue, $log) {
        var _this = this;
        this.name = name;
        this.doneCB = doneCB;
        this.$rootScope = $rootScope;
        this.engineQueue = engineQueue;
        this.TimeoutValue = TimeoutValue;
        this.$log = $log;
        this.untouched = true;
        this.timer = Date.now();
        this.getCount = function () {
            return _this.count;
        };
        this.isDone = function () {
            return _this.done;
        };
        this.clearTimeout = function () {
            if (typeof _this.timeout !== 'undefined') {
                _this.timeout = window.clearTimeout(_this.timeout);
                _this.$log.dev(_this.name, 'Timeout cleared', _this.timeout);
            }
        };
        this.touch = function () {
            _this.$log.dev('Counter ' + _this.name, 'is getting touched');
            if (_this.untouched === true) {
                _this.$log.dev('Counter ' + _this.name, 'has been touched', _this.untouched, _this.getCount());
                _this.engineQueue.setStatus(_this.name, true);
                _this.untouched = false;
                _this.triggerIdle();
            }
            else {
                _this.$log.dev('Counter ' + _this.name, 'wont get touched', _this.untouched, _this.getCount());
            }
        };
        this.incr = function () {
            _this.untouched = false;
            if (_this.done) {
                return;
            }
            _this.count++;
            _this.$log.dev(_this.name, 'Incrementing counter ', _this.count);
            _this.engineQueue.setStatus(_this.name, false);
            _this.clearTimeout();
        };
        this.decr = function () {
            if (_this.done) {
                return;
            }
            _this.count--;
            _this.$log.dev(_this.name, 'Decrementing counter ', _this.count);
            _this.engineQueue.setStatus(_this.name, false);
            _this.clearTimeout();
            if (_this.count === 0) {
                _this.triggerIdle();
            }
        };
        this.triggerIdle = function () {
            _this.clearTimeout();
            _this.$log.dev(_this.name, 'triggerIdle called', _this.count, _this.TimeoutValue);
            _this.timeout = setTimeout(function () {
                if (_this.count === 0) {
                    _this.$log.dev(_this.name, 'setting the doneVar to true', _this.count);
                    _this.engineQueue.setStatus(_this.name, true);
                    if (_this.engineQueue.isDone()) {
                        _this.done = true;
                        _this.$log.dev(_this.name, 'calling CB()');
                        _this.doneCB();
                    }
                }
                else {
                    _this.$log.dev(_this.name, 'triggerIdle cancelled ', _this.count);
                    _this.engineQueue.setStatus(_this.name, false);
                }
            }, _this.TimeoutValue);
            _this.$log.dev(_this.name, 'timeout set to', _this.timeout);
        };
        this.done = false;
        this.count = 0;
        this.engineQueue.setStatus(this.name, false);
        $log.dev('counter', 'constructor called', this.name);
    }
    return Counter;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CounterFactory;
