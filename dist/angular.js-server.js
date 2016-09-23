/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var httpInterceptorQueue_1 = __webpack_require__(1);
	var log_1 = __webpack_require__(2);
	var exceptionHandler_1 = __webpack_require__(3);
	var engineQueue_1 = __webpack_require__(4);
	var q2_1 = __webpack_require__(5);
	var Counter_1 = __webpack_require__(6);
	var serverModule = angular.module('server', [])
	    .constant('TimeoutValue', 200)
	    .config(function ($provide, $injector, $httpProvider, $windowProvider) {
	    var $window = $windowProvider.$get();
	    if (typeof $window.onServer !== 'undefined' && $window.onServer === true) {
	        $provide.factory('counter', Counter_1.default);
	        $provide.factory('engineQueue', engineQueue_1.default);
	        $provide.decorator('$q', q2_1.default);
	        $provide.decorator('$exceptionHandler', exceptionHandler_1.default);
	        $provide.decorator('$log', log_1.default);
	        $provide.factory('httpInterceptorQueue', httpInterceptorQueue_1.default);
	        $httpProvider.interceptors.push('httpInterceptorQueue');
	    }
	}).run(function ($rootScope, $injector, $http, $log, $window, $timeout, TimeoutValue) {
	    if (typeof $window.onServer !== 'undefined' && $window.onServer === true) {
	        var counter = $injector.get('counter');
	        counter.create('digest', function () {
	            $log.dev('run', 'digestWatcher cleanup', digestWatcher);
	            digestWatcher();
	        });
	        var digestWatcher = $rootScope.$watch(function () {
	            counter.incr('digest');
	            $rootScope.$$postDigest(function () {
	                counter.decr('digest');
	            });
	        });
	        $rootScope.$apply(function () {
	            $timeout(function () {
	                $log.dev('index.ts', 'touching');
	                counter.touch('http');
	                counter.touch('q');
	            }, TimeoutValue);
	        });
	    }
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	var _this = this;
	var HttpInterceptorQueue = function ($q, $window, $rootScope, $log, TimeoutValue, counter) {
	    $log.dev('HttpInterceptor', 'instanciated', _this);
	    var hCounter = counter.create('http');
	    return {
	        request: function (config) {
	            $log.dev('httpRequest', config.url);
	            hCounter.incr();
	            return $q.when(config);
	        },
	        requestError: function (rejection) {
	            hCounter.decr();
	            return $q.reject(rejection);
	        },
	        response: function (response) {
	            $log.dev('httpResponse', response.config.url);
	            hCounter.decr();
	            return $q.when(response);
	        },
	        responseError: function (response) {
	            $log.dev('httpResponse', response.config.url);
	            hCounter.decr();
	            return $q.reject(response);
	        }
	    };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = HttpInterceptorQueue;


/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	var _this = this;
	var logDecorator = function ($delegate, $window) {
	    var isDef = function (name) { return angular.isDefined($window[name]); };
	    if (isDef('onServer') && isDef('fs') && isDef('logConfig') && $window['onServer'] === true) { }
	    else {
	        return $delegate;
	    }
	    var fs = $window['fs'];
	    var config = $window['logConfig'];
	    var timer = Date.now();
	    var formatMsg = function () {
	        var str = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            str[_i - 0] = arguments[_i];
	        }
	        var date = new Date();
	        return date + " -> " + str.join(' ') + '\n';
	    };
	    var devLog = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        var time = Date.now() - timer;
	        timer = Date.now();
	        var name = args.shift();
	        args.unshift(name + '+' + time);
	        fs.appendFile(config.dir + '/dev', args.join(', '), function (err) {
	            if (err)
	                throw err;
	        });
	        console.debug.apply(_this, args);
	    };
	    var newLog = Object.create($delegate);
	    newLog.prototype = $delegate.prototype;
	    ['log', 'warn', 'info', 'error', 'debug'].forEach(function (item) {
	        if (config[item].enabled) {
	            newLog[item] = function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                var msg = formatMsg.apply(this, args);
	                if (config[item].stack === true) {
	                    var err = new Error();
	                    var stack = err['stack'];
	                    msg += stack + '\n\n';
	                }
	                fs.appendFile(config.dir + '/' + item, msg, function (err) {
	                    if (err)
	                        throw err;
	                });
	                return new Object();
	            };
	        }
	        else {
	            newLog[item] = $delegate[item];
	        }
	    });
	    newLog['dev'] = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        if ($window['serverDebug'] === true) {
	            if ($window.serverDebug === true && args[0] !== 'digest') {
	                devLog.apply(null, args);
	            }
	            else if (typeof $window.serverDebug.digest === 'boolean' && $window.serverDebug.digest === true) {
	                devLog.apply(null, args);
	            }
	        }
	    };
	    return newLog;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = logDecorator;


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	var ExceptionHandler = function ($delegate, $log, $window) {
	    var errorHandler = function (error, cause) {
	        var err = new Error();
	        var stack = err['stack'];
	        var errorEvent = new $window.CustomEvent('ServerExceptionHandler');
	        errorEvent.details = {
	            exception: error,
	            cause: cause,
	            err: stack
	        };
	        $window.dispatchEvent(errorEvent);
	        return $delegate(error, cause);
	    };
	    return errorHandler;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ExceptionHandler;


/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	var IdleEvent = (function () {
	    function IdleEvent() {
	    }
	    IdleEvent.Send = function ($window) {
	        var Event = $window['Event'];
	        var dispatchEvent = $window.dispatchEvent;
	        var IdleEvent = new Event('Idle');
	        dispatchEvent(IdleEvent);
	    };
	    return IdleEvent;
	}());
	var EngineQueue = function ($log, $window) {
	    var doneVar = {};
	    var setStatus = function (name, value) {
	        if (isDone) {
	            return;
	        }
	        doneVar[name] = value;
	        if (value === true) {
	            done(name);
	        }
	    };
	    var isDone = false;
	    var areDoneVarAllTrue = function () {
	        for (var key in doneVar) {
	            if (!doneVar[key]) {
	                return false;
	            }
	        }
	        return true;
	    };
	    var done = function (from) {
	        $log.dev('engineQueue.isDone()', from, doneVar);
	        if (isDone) {
	            return isDone;
	        }
	        if (areDoneVarAllTrue()) {
	            isDone = true;
	            IdleEvent.Send($window);
	        }
	        return isDone;
	    };
	    return {
	        isDone: done,
	        setStatus: setStatus
	    };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = EngineQueue;


/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';
	var Q = function ($delegate, $rootScope, TimeoutValue, counter) {
	    var qCounter = counter.create('q');
	    var proto = $delegate.prototype;
	    var Odefer = $delegate.defer;
	    var Oreject = $delegate.reject;
	    var Orace = $delegate.race;
	    var Oall = $delegate.all;
	    var Oresolve = $delegate.resolve;
	    var deferFn = function (context) {
	        return function () {
	            var deferred = Odefer.apply(context, []);
	            var originalDeferResolve = deferred.resolve;
	            deferred.resolve = function () {
	                qCounter.decr();
	                return originalDeferResolve.apply(deferred, arguments);
	            };
	            var originalDeferReject = deferred.reject;
	            deferred.reject = function () {
	                qCounter.decr();
	                return originalDeferReject.apply(deferred, arguments);
	            };
	            qCounter.incr();
	            return deferred;
	        };
	    };
	    var $Q = function (resolver) {
	        if (typeof resolver !== 'function') {
	            throw new Error('norslvr - Expected resolverFn, got - resolver');
	        }
	        var deferred = deferFn(this)();
	        function resolveFn(value) {
	            deferred.resolve(value);
	        }
	        function rejectFn(reason) {
	            deferred.reject(reason);
	        }
	        resolver(resolveFn, rejectFn);
	        return deferred.promise;
	    };
	    $Q.prototype = proto;
	    $Q.defer = deferFn($delegate);
	    $Q.reject = $delegate.reject;
	    $Q.when = $delegate.when;
	    $Q.resolve = Oresolve;
	    $Q.all = Oall;
	    $Q.race = Orace;
	    return $Q;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Q;


/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	var CounterFactory = function ($rootScope, $log, engineQueue, TimeoutValue) {
	    var counters = {};
	    var createCounter = function (name, doneCB) {
	        if (!doneCB) {
	            doneCB = function () {
	            };
	        }
	        $log.dev('counter', 'creating counter', name);
	        counters[name] = new Counter(name, doneCB, $rootScope, engineQueue, TimeoutValue, $log);
	        return counters[name];
	    };
	    var incr = function (name) {
	        counters[name].incr();
	    };
	    var decr = function (name) {
	        counters[name].decr();
	    };
	    var getCount = function (name) {
	        return counters[name].getCount();
	    };
	    var touch = function (name) {
	        counters[name].touch();
	    };
	    return {
	        create: createCounter,
	        incr: incr,
	        decr: decr,
	        getCount: getCount,
	        touch: touch
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
	                _this.$log.dev(_this.name, 'Timeout cleared', _this.timeout);
	                _this.timeout = window.clearTimeout(_this.timeout);
	            }
	        };
	        this.touch = function () {
	            if (_this.untouched) {
	                _this.$log.dev('Counter' + _this.name, 'is getting touched');
	                _this.engineQueue.setStatus(_this.name, true);
	                _this.triggerIdle();
	            }
	        };
	        this.incr = function () {
	            _this.untouched = false;
	            if (_this.done) {
	                return;
	            }
	            _this.count++;
	            if (_this.name !== 'digest') {
	                _this.$log.dev(_this.name, 'Incrementing counter ', _this.count);
	            }
	            _this.$log.dev(_this.name, 'Incrementing counter ', _this.count);
	            _this.engineQueue.setStatus(_this.name, false);
	            _this.clearTimeout();
	        };
	        this.decr = function () {
	            if (_this.done) {
	                return;
	            }
	            _this.count--;
	            if (_this.name !== 'digest') {
	                _this.$log.dev(_this.name, 'Decrementing counter ', _this.count);
	            }
	            _this.engineQueue.setStatus(_this.name, false);
	            _this.clearTimeout();
	            if (_this.count === 0) {
	                _this.triggerIdle();
	            }
	        };
	        this.triggerIdle = function () {
	            _this.clearTimeout();
	            _this.$log.dev(_this.name, 'triggerIdle called', _this.count, _this.TimeoutValue);
	            _this.timeout = window.setTimeout(function () {
	                if (this.count === 0) {
	                    this.$log.dev(this.name, 'setting the doneVar to true', this.count);
	                    this.engineQueue.setStatus(this.name, true);
	                    if (this.engineQueue.isDone()) {
	                        this.done = true;
	                        this.$log.dev(this.name, 'calling CB()');
	                        this.doneCB();
	                    }
	                }
	                else {
	                    this.$log.dev(this.name, 'triggerIdle cancelled ', this.count);
	                    this.engineQueue.setStatus(this.name, false);
	                }
	            }.bind(_this), _this.TimeoutValue);
	            _this.$log.dev(_this.name, 'timeout set to', _this.timeout);
	        };
	        this.done = false;
	        this.count = 0;
	        this.engineQueue.setStatus(this.name, false);
	    }
	    return Counter;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = CounterFactory;


/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZTU1YzRhZTA2MDY2OGE1ZDU1NmEiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovLy8uL3NyYy9mYWN0b3J5L2h0dHBJbnRlcmNlcHRvclF1ZXVlLnRzIiwid2VicGFjazovLy8uL3NyYy9kZWNvcmF0b3IvbG9nLnRzIiwid2VicGFjazovLy8uL3NyYy9kZWNvcmF0b3IvZXhjZXB0aW9uSGFuZGxlci50cyIsIndlYnBhY2s6Ly8vLi9zcmMvZmFjdG9yeS9lbmdpbmVRdWV1ZS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvZGVjb3JhdG9yL3EyLnRzIiwid2VicGFjazovLy8uL3NyYy9mYWN0b3J5L0NvdW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiLFVBQVM7QUFDVDtBQUNBLEVBQUM7Ozs7Ozs7QUN6Q0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQThDLGNBQWM7QUFDNUQ7Ozs7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0Esa0NBQWlDLHlDQUF5QztBQUMxRSxrR0FBaUc7QUFDakc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF3Qix1QkFBdUI7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBd0IsdUJBQXVCO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWdDLHVCQUF1QjtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0EseUJBQXdCLHVCQUF1QjtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUE4QyxjQUFjO0FBQzVEOzs7Ozs7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQThDLGNBQWM7QUFDNUQ7Ozs7Ozs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBOEMsY0FBYztBQUM1RDs7Ozs7OztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUE4QyxjQUFjO0FBQzVEOzs7Ozs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQztBQUNELCtDQUE4QyxjQUFjO0FBQzVEIiwiZmlsZSI6ImRpc3QvYW5ndWxhci5qcy1zZXJ2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIGU1NWM0YWUwNjA2NjhhNWQ1NTZhXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgaHR0cEludGVyY2VwdG9yUXVldWVfMSA9IHJlcXVpcmUoJy4vZmFjdG9yeS9odHRwSW50ZXJjZXB0b3JRdWV1ZScpO1xudmFyIGxvZ18xID0gcmVxdWlyZSgnLi9kZWNvcmF0b3IvbG9nJyk7XG52YXIgZXhjZXB0aW9uSGFuZGxlcl8xID0gcmVxdWlyZSgnLi9kZWNvcmF0b3IvZXhjZXB0aW9uSGFuZGxlcicpO1xudmFyIGVuZ2luZVF1ZXVlXzEgPSByZXF1aXJlKCcuL2ZhY3RvcnkvZW5naW5lUXVldWUnKTtcbnZhciBxMl8xID0gcmVxdWlyZSgnLi9kZWNvcmF0b3IvcTInKTtcbnZhciBDb3VudGVyXzEgPSByZXF1aXJlKCcuL2ZhY3RvcnkvQ291bnRlcicpO1xudmFyIHNlcnZlck1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdzZXJ2ZXInLCBbXSlcbiAgICAuY29uc3RhbnQoJ1RpbWVvdXRWYWx1ZScsIDIwMClcbiAgICAuY29uZmlnKGZ1bmN0aW9uICgkcHJvdmlkZSwgJGluamVjdG9yLCAkaHR0cFByb3ZpZGVyLCAkd2luZG93UHJvdmlkZXIpIHtcbiAgICB2YXIgJHdpbmRvdyA9ICR3aW5kb3dQcm92aWRlci4kZ2V0KCk7XG4gICAgaWYgKHR5cGVvZiAkd2luZG93Lm9uU2VydmVyICE9PSAndW5kZWZpbmVkJyAmJiAkd2luZG93Lm9uU2VydmVyID09PSB0cnVlKSB7XG4gICAgICAgICRwcm92aWRlLmZhY3RvcnkoJ2NvdW50ZXInLCBDb3VudGVyXzEuZGVmYXVsdCk7XG4gICAgICAgICRwcm92aWRlLmZhY3RvcnkoJ2VuZ2luZVF1ZXVlJywgZW5naW5lUXVldWVfMS5kZWZhdWx0KTtcbiAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckcScsIHEyXzEuZGVmYXVsdCk7XG4gICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJGV4Y2VwdGlvbkhhbmRsZXInLCBleGNlcHRpb25IYW5kbGVyXzEuZGVmYXVsdCk7XG4gICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJGxvZycsIGxvZ18xLmRlZmF1bHQpO1xuICAgICAgICAkcHJvdmlkZS5mYWN0b3J5KCdodHRwSW50ZXJjZXB0b3JRdWV1ZScsIGh0dHBJbnRlcmNlcHRvclF1ZXVlXzEuZGVmYXVsdCk7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ2h0dHBJbnRlcmNlcHRvclF1ZXVlJyk7XG4gICAgfVxufSkucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkaW5qZWN0b3IsICRodHRwLCAkbG9nLCAkd2luZG93LCAkdGltZW91dCwgVGltZW91dFZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiAkd2luZG93Lm9uU2VydmVyICE9PSAndW5kZWZpbmVkJyAmJiAkd2luZG93Lm9uU2VydmVyID09PSB0cnVlKSB7XG4gICAgICAgIHZhciBjb3VudGVyID0gJGluamVjdG9yLmdldCgnY291bnRlcicpO1xuICAgICAgICBjb3VudGVyLmNyZWF0ZSgnZGlnZXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJGxvZy5kZXYoJ3J1bicsICdkaWdlc3RXYXRjaGVyIGNsZWFudXAnLCBkaWdlc3RXYXRjaGVyKTtcbiAgICAgICAgICAgIGRpZ2VzdFdhdGNoZXIoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBkaWdlc3RXYXRjaGVyID0gJHJvb3RTY29wZS4kd2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY291bnRlci5pbmNyKCdkaWdlc3QnKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJCRwb3N0RGlnZXN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVyLmRlY3IoJ2RpZ2VzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkcm9vdFNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJGxvZy5kZXYoJ2luZGV4LnRzJywgJ3RvdWNoaW5nJyk7XG4gICAgICAgICAgICAgICAgY291bnRlci50b3VjaCgnaHR0cCcpO1xuICAgICAgICAgICAgICAgIGNvdW50ZXIudG91Y2goJ3EnKTtcbiAgICAgICAgICAgIH0sIFRpbWVvdXRWYWx1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9pbmRleC50c1xuICoqIG1vZHVsZSBpZCA9IDBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcbnZhciBfdGhpcyA9IHRoaXM7XG52YXIgSHR0cEludGVyY2VwdG9yUXVldWUgPSBmdW5jdGlvbiAoJHEsICR3aW5kb3csICRyb290U2NvcGUsICRsb2csIFRpbWVvdXRWYWx1ZSwgY291bnRlcikge1xuICAgICRsb2cuZGV2KCdIdHRwSW50ZXJjZXB0b3InLCAnaW5zdGFuY2lhdGVkJywgX3RoaXMpO1xuICAgIHZhciBoQ291bnRlciA9IGNvdW50ZXIuY3JlYXRlKCdodHRwJyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgJGxvZy5kZXYoJ2h0dHBSZXF1ZXN0JywgY29uZmlnLnVybCk7XG4gICAgICAgICAgICBoQ291bnRlci5pbmNyKCk7XG4gICAgICAgICAgICByZXR1cm4gJHEud2hlbihjb25maWcpO1xuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0RXJyb3I6IGZ1bmN0aW9uIChyZWplY3Rpb24pIHtcbiAgICAgICAgICAgIGhDb3VudGVyLmRlY3IoKTtcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgJGxvZy5kZXYoJ2h0dHBSZXNwb25zZScsIHJlc3BvbnNlLmNvbmZpZy51cmwpO1xuICAgICAgICAgICAgaENvdW50ZXIuZGVjcigpO1xuICAgICAgICAgICAgcmV0dXJuICRxLndoZW4ocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICRsb2cuZGV2KCdodHRwUmVzcG9uc2UnLCByZXNwb25zZS5jb25maWcudXJsKTtcbiAgICAgICAgICAgIGhDb3VudGVyLmRlY3IoKTtcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBIdHRwSW50ZXJjZXB0b3JRdWV1ZTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvZmFjdG9yeS9odHRwSW50ZXJjZXB0b3JRdWV1ZS50c1xuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcbnZhciBfdGhpcyA9IHRoaXM7XG52YXIgbG9nRGVjb3JhdG9yID0gZnVuY3Rpb24gKCRkZWxlZ2F0ZSwgJHdpbmRvdykge1xuICAgIHZhciBpc0RlZiA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBhbmd1bGFyLmlzRGVmaW5lZCgkd2luZG93W25hbWVdKTsgfTtcbiAgICBpZiAoaXNEZWYoJ29uU2VydmVyJykgJiYgaXNEZWYoJ2ZzJykgJiYgaXNEZWYoJ2xvZ0NvbmZpZycpICYmICR3aW5kb3dbJ29uU2VydmVyJ10gPT09IHRydWUpIHsgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgIH1cbiAgICB2YXIgZnMgPSAkd2luZG93WydmcyddO1xuICAgIHZhciBjb25maWcgPSAkd2luZG93Wydsb2dDb25maWcnXTtcbiAgICB2YXIgdGltZXIgPSBEYXRlLm5vdygpO1xuICAgIHZhciBmb3JtYXRNc2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdHIgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHN0cltfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHJldHVybiBkYXRlICsgXCIgLT4gXCIgKyBzdHIuam9pbignICcpICsgJ1xcbic7XG4gICAgfTtcbiAgICB2YXIgZGV2TG9nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGltZSA9IERhdGUubm93KCkgLSB0aW1lcjtcbiAgICAgICAgdGltZXIgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgbmFtZSA9IGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgYXJncy51bnNoaWZ0KG5hbWUgKyAnKycgKyB0aW1lKTtcbiAgICAgICAgZnMuYXBwZW5kRmlsZShjb25maWcuZGlyICsgJy9kZXYnLCBhcmdzLmpvaW4oJywgJyksIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1Zy5hcHBseShfdGhpcywgYXJncyk7XG4gICAgfTtcbiAgICB2YXIgbmV3TG9nID0gT2JqZWN0LmNyZWF0ZSgkZGVsZWdhdGUpO1xuICAgIG5ld0xvZy5wcm90b3R5cGUgPSAkZGVsZWdhdGUucHJvdG90eXBlO1xuICAgIFsnbG9nJywgJ3dhcm4nLCAnaW5mbycsICdlcnJvcicsICdkZWJ1ZyddLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgaWYgKGNvbmZpZ1tpdGVtXS5lbmFibGVkKSB7XG4gICAgICAgICAgICBuZXdMb2dbaXRlbV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gZm9ybWF0TXNnLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGlmIChjb25maWdbaXRlbV0uc3RhY2sgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhY2sgPSBlcnJbJ3N0YWNrJ107XG4gICAgICAgICAgICAgICAgICAgIG1zZyArPSBzdGFjayArICdcXG5cXG4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmcy5hcHBlbmRGaWxlKGNvbmZpZy5kaXIgKyAnLycgKyBpdGVtLCBtc2csIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE9iamVjdCgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5ld0xvZ1tpdGVtXSA9ICRkZWxlZ2F0ZVtpdGVtXTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIG5ld0xvZ1snZGV2J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkd2luZG93WydzZXJ2ZXJEZWJ1ZyddID09PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAoJHdpbmRvdy5zZXJ2ZXJEZWJ1ZyA9PT0gdHJ1ZSAmJiBhcmdzWzBdICE9PSAnZGlnZXN0Jykge1xuICAgICAgICAgICAgICAgIGRldkxvZy5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiAkd2luZG93LnNlcnZlckRlYnVnLmRpZ2VzdCA9PT0gJ2Jvb2xlYW4nICYmICR3aW5kb3cuc2VydmVyRGVidWcuZGlnZXN0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZGV2TG9nLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gbmV3TG9nO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGxvZ0RlY29yYXRvcjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvZGVjb3JhdG9yL2xvZy50c1xuICoqIG1vZHVsZSBpZCA9IDJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcbnZhciBFeGNlcHRpb25IYW5kbGVyID0gZnVuY3Rpb24gKCRkZWxlZ2F0ZSwgJGxvZywgJHdpbmRvdykge1xuICAgIHZhciBlcnJvckhhbmRsZXIgPSBmdW5jdGlvbiAoZXJyb3IsIGNhdXNlKSB7XG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgdmFyIHN0YWNrID0gZXJyWydzdGFjayddO1xuICAgICAgICB2YXIgZXJyb3JFdmVudCA9IG5ldyAkd2luZG93LkN1c3RvbUV2ZW50KCdTZXJ2ZXJFeGNlcHRpb25IYW5kbGVyJyk7XG4gICAgICAgIGVycm9yRXZlbnQuZGV0YWlscyA9IHtcbiAgICAgICAgICAgIGV4Y2VwdGlvbjogZXJyb3IsXG4gICAgICAgICAgICBjYXVzZTogY2F1c2UsXG4gICAgICAgICAgICBlcnI6IHN0YWNrXG4gICAgICAgIH07XG4gICAgICAgICR3aW5kb3cuZGlzcGF0Y2hFdmVudChlcnJvckV2ZW50KTtcbiAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZShlcnJvciwgY2F1c2UpO1xuICAgIH07XG4gICAgcmV0dXJuIGVycm9ySGFuZGxlcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBFeGNlcHRpb25IYW5kbGVyO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9kZWNvcmF0b3IvZXhjZXB0aW9uSGFuZGxlci50c1xuICoqIG1vZHVsZSBpZCA9IDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIlwidXNlIHN0cmljdFwiO1xudmFyIElkbGVFdmVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSWRsZUV2ZW50KCkge1xuICAgIH1cbiAgICBJZGxlRXZlbnQuU2VuZCA9IGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHZhciBFdmVudCA9ICR3aW5kb3dbJ0V2ZW50J107XG4gICAgICAgIHZhciBkaXNwYXRjaEV2ZW50ID0gJHdpbmRvdy5kaXNwYXRjaEV2ZW50O1xuICAgICAgICB2YXIgSWRsZUV2ZW50ID0gbmV3IEV2ZW50KCdJZGxlJyk7XG4gICAgICAgIGRpc3BhdGNoRXZlbnQoSWRsZUV2ZW50KTtcbiAgICB9O1xuICAgIHJldHVybiBJZGxlRXZlbnQ7XG59KCkpO1xudmFyIEVuZ2luZVF1ZXVlID0gZnVuY3Rpb24gKCRsb2csICR3aW5kb3cpIHtcbiAgICB2YXIgZG9uZVZhciA9IHt9O1xuICAgIHZhciBzZXRTdGF0dXMgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGlzRG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRvbmVWYXJbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKSB7XG4gICAgICAgICAgICBkb25lKG5hbWUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgaXNEb25lID0gZmFsc2U7XG4gICAgdmFyIGFyZURvbmVWYXJBbGxUcnVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gZG9uZVZhcikge1xuICAgICAgICAgICAgaWYgKCFkb25lVmFyW2tleV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uIChmcm9tKSB7XG4gICAgICAgICRsb2cuZGV2KCdlbmdpbmVRdWV1ZS5pc0RvbmUoKScsIGZyb20sIGRvbmVWYXIpO1xuICAgICAgICBpZiAoaXNEb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNEb25lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmVEb25lVmFyQWxsVHJ1ZSgpKSB7XG4gICAgICAgICAgICBpc0RvbmUgPSB0cnVlO1xuICAgICAgICAgICAgSWRsZUV2ZW50LlNlbmQoJHdpbmRvdyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzRG9uZTtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGlzRG9uZTogZG9uZSxcbiAgICAgICAgc2V0U3RhdHVzOiBzZXRTdGF0dXNcbiAgICB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEVuZ2luZVF1ZXVlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9mYWN0b3J5L2VuZ2luZVF1ZXVlLnRzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyIFEgPSBmdW5jdGlvbiAoJGRlbGVnYXRlLCAkcm9vdFNjb3BlLCBUaW1lb3V0VmFsdWUsIGNvdW50ZXIpIHtcbiAgICB2YXIgcUNvdW50ZXIgPSBjb3VudGVyLmNyZWF0ZSgncScpO1xuICAgIHZhciBwcm90byA9ICRkZWxlZ2F0ZS5wcm90b3R5cGU7XG4gICAgdmFyIE9kZWZlciA9ICRkZWxlZ2F0ZS5kZWZlcjtcbiAgICB2YXIgT3JlamVjdCA9ICRkZWxlZ2F0ZS5yZWplY3Q7XG4gICAgdmFyIE9yYWNlID0gJGRlbGVnYXRlLnJhY2U7XG4gICAgdmFyIE9hbGwgPSAkZGVsZWdhdGUuYWxsO1xuICAgIHZhciBPcmVzb2x2ZSA9ICRkZWxlZ2F0ZS5yZXNvbHZlO1xuICAgIHZhciBkZWZlckZuID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IE9kZWZlci5hcHBseShjb250ZXh0LCBbXSk7XG4gICAgICAgICAgICB2YXIgb3JpZ2luYWxEZWZlclJlc29sdmUgPSBkZWZlcnJlZC5yZXNvbHZlO1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxQ291bnRlci5kZWNyKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsRGVmZXJSZXNvbHZlLmFwcGx5KGRlZmVycmVkLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBvcmlnaW5hbERlZmVyUmVqZWN0ID0gZGVmZXJyZWQucmVqZWN0O1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHFDb3VudGVyLmRlY3IoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxEZWZlclJlamVjdC5hcHBseShkZWZlcnJlZCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBxQ291bnRlci5pbmNyKCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQ7XG4gICAgICAgIH07XG4gICAgfTtcbiAgICB2YXIgJFEgPSBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3JzbHZyIC0gRXhwZWN0ZWQgcmVzb2x2ZXJGbiwgZ290IC0gcmVzb2x2ZXInKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlckZuKHRoaXMpKCk7XG4gICAgICAgIGZ1bmN0aW9uIHJlc29sdmVGbih2YWx1ZSkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0Rm4ocmVhc29uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVhc29uKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlcihyZXNvbHZlRm4sIHJlamVjdEZuKTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgICAkUS5wcm90b3R5cGUgPSBwcm90bztcbiAgICAkUS5kZWZlciA9IGRlZmVyRm4oJGRlbGVnYXRlKTtcbiAgICAkUS5yZWplY3QgPSAkZGVsZWdhdGUucmVqZWN0O1xuICAgICRRLndoZW4gPSAkZGVsZWdhdGUud2hlbjtcbiAgICAkUS5yZXNvbHZlID0gT3Jlc29sdmU7XG4gICAgJFEuYWxsID0gT2FsbDtcbiAgICAkUS5yYWNlID0gT3JhY2U7XG4gICAgcmV0dXJuICRRO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFE7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2RlY29yYXRvci9xMi50c1xuICoqIG1vZHVsZSBpZCA9IDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIlwidXNlIHN0cmljdFwiO1xudmFyIENvdW50ZXJGYWN0b3J5ID0gZnVuY3Rpb24gKCRyb290U2NvcGUsICRsb2csIGVuZ2luZVF1ZXVlLCBUaW1lb3V0VmFsdWUpIHtcbiAgICB2YXIgY291bnRlcnMgPSB7fTtcbiAgICB2YXIgY3JlYXRlQ291bnRlciA9IGZ1bmN0aW9uIChuYW1lLCBkb25lQ0IpIHtcbiAgICAgICAgaWYgKCFkb25lQ0IpIHtcbiAgICAgICAgICAgIGRvbmVDQiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJGxvZy5kZXYoJ2NvdW50ZXInLCAnY3JlYXRpbmcgY291bnRlcicsIG5hbWUpO1xuICAgICAgICBjb3VudGVyc1tuYW1lXSA9IG5ldyBDb3VudGVyKG5hbWUsIGRvbmVDQiwgJHJvb3RTY29wZSwgZW5naW5lUXVldWUsIFRpbWVvdXRWYWx1ZSwgJGxvZyk7XG4gICAgICAgIHJldHVybiBjb3VudGVyc1tuYW1lXTtcbiAgICB9O1xuICAgIHZhciBpbmNyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgY291bnRlcnNbbmFtZV0uaW5jcigpO1xuICAgIH07XG4gICAgdmFyIGRlY3IgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBjb3VudGVyc1tuYW1lXS5kZWNyKCk7XG4gICAgfTtcbiAgICB2YXIgZ2V0Q291bnQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gY291bnRlcnNbbmFtZV0uZ2V0Q291bnQoKTtcbiAgICB9O1xuICAgIHZhciB0b3VjaCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGNvdW50ZXJzW25hbWVdLnRvdWNoKCk7XG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGU6IGNyZWF0ZUNvdW50ZXIsXG4gICAgICAgIGluY3I6IGluY3IsXG4gICAgICAgIGRlY3I6IGRlY3IsXG4gICAgICAgIGdldENvdW50OiBnZXRDb3VudCxcbiAgICAgICAgdG91Y2g6IHRvdWNoXG4gICAgfTtcbn07XG52YXIgQ291bnRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ291bnRlcihuYW1lLCBkb25lQ0IsICRyb290U2NvcGUsIGVuZ2luZVF1ZXVlLCBUaW1lb3V0VmFsdWUsICRsb2cpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb25lQ0IgPSBkb25lQ0I7XG4gICAgICAgIHRoaXMuJHJvb3RTY29wZSA9ICRyb290U2NvcGU7XG4gICAgICAgIHRoaXMuZW5naW5lUXVldWUgPSBlbmdpbmVRdWV1ZTtcbiAgICAgICAgdGhpcy5UaW1lb3V0VmFsdWUgPSBUaW1lb3V0VmFsdWU7XG4gICAgICAgIHRoaXMuJGxvZyA9ICRsb2c7XG4gICAgICAgIHRoaXMudW50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aW1lciA9IERhdGUubm93KCk7XG4gICAgICAgIHRoaXMuZ2V0Q291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuY291bnQ7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaXNEb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLmRvbmU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy50aW1lb3V0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KF90aGlzLm5hbWUsICdUaW1lb3V0IGNsZWFyZWQnLCBfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gd2luZG93LmNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy50b3VjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy51bnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy4kbG9nLmRldignQ291bnRlcicgKyBfdGhpcy5uYW1lLCAnaXMgZ2V0dGluZyB0b3VjaGVkJyk7XG4gICAgICAgICAgICAgICAgX3RoaXMuZW5naW5lUXVldWUuc2V0U3RhdHVzKF90aGlzLm5hbWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIF90aGlzLnRyaWdnZXJJZGxlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5jciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLnVudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKF90aGlzLmRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5jb3VudCsrO1xuICAgICAgICAgICAgaWYgKF90aGlzLm5hbWUgIT09ICdkaWdlc3QnKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuJGxvZy5kZXYoX3RoaXMubmFtZSwgJ0luY3JlbWVudGluZyBjb3VudGVyICcsIF90aGlzLmNvdW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KF90aGlzLm5hbWUsICdJbmNyZW1lbnRpbmcgY291bnRlciAnLCBfdGhpcy5jb3VudCk7XG4gICAgICAgICAgICBfdGhpcy5lbmdpbmVRdWV1ZS5zZXRTdGF0dXMoX3RoaXMubmFtZSwgZmFsc2UpO1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJUaW1lb3V0KCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGVjciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5kb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuY291bnQtLTtcbiAgICAgICAgICAgIGlmIChfdGhpcy5uYW1lICE9PSAnZGlnZXN0Jykge1xuICAgICAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KF90aGlzLm5hbWUsICdEZWNyZW1lbnRpbmcgY291bnRlciAnLCBfdGhpcy5jb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5lbmdpbmVRdWV1ZS5zZXRTdGF0dXMoX3RoaXMubmFtZSwgZmFsc2UpO1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJUaW1lb3V0KCk7XG4gICAgICAgICAgICBpZiAoX3RoaXMuY291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VySWRsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRyaWdnZXJJZGxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJUaW1lb3V0KCk7XG4gICAgICAgICAgICBfdGhpcy4kbG9nLmRldihfdGhpcy5uYW1lLCAndHJpZ2dlcklkbGUgY2FsbGVkJywgX3RoaXMuY291bnQsIF90aGlzLlRpbWVvdXRWYWx1ZSk7XG4gICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGxvZy5kZXYodGhpcy5uYW1lLCAnc2V0dGluZyB0aGUgZG9uZVZhciB0byB0cnVlJywgdGhpcy5jb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW5naW5lUXVldWUuc2V0U3RhdHVzKHRoaXMubmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVuZ2luZVF1ZXVlLmlzRG9uZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kbG9nLmRldih0aGlzLm5hbWUsICdjYWxsaW5nIENCKCknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZG9uZUNCKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGxvZy5kZXYodGhpcy5uYW1lLCAndHJpZ2dlcklkbGUgY2FuY2VsbGVkICcsIHRoaXMuY291bnQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVuZ2luZVF1ZXVlLnNldFN0YXR1cyh0aGlzLm5hbWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQoX3RoaXMpLCBfdGhpcy5UaW1lb3V0VmFsdWUpO1xuICAgICAgICAgICAgX3RoaXMuJGxvZy5kZXYoX3RoaXMubmFtZSwgJ3RpbWVvdXQgc2V0IHRvJywgX3RoaXMudGltZW91dCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5lbmdpbmVRdWV1ZS5zZXRTdGF0dXModGhpcy5uYW1lLCBmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiBDb3VudGVyO1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IENvdW50ZXJGYWN0b3J5O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9mYWN0b3J5L0NvdW50ZXIudHNcbiAqKiBtb2R1bGUgaWQgPSA2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9