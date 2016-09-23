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
	    .constant('TimeoutValue', 500)
	    .config(function ($provide, $httpProvider, $windowProvider) {
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
	}).run(function ($rootScope, $q, $http, $injector, $window) {
	    if (typeof $window.onServer !== 'undefined' && $window.onServer === true) {
	        var counter = $injector.get('counter', 'angular.js-module run()');
	        counter.create('digest', function () {
	            digestWatcher();
	        });
	        var digestWatcher = $rootScope.$watch(function () {
	            counter.incr('digest');
	            $rootScope.$$postDigest(function () {
	                counter.decr('digest');
	            });
	        });
	        $rootScope.$apply(function () { var i = 0; });
	        $q(function (resolve, reject) { resolve(true); }).then(function (res) { });
	        $http.get('/someInexistantValue', { config: { timeout: 10 } });
	    }
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	var HttpInterceptorQueue = function ($q, $window, $rootScope, TimeoutValue, counter) {
	    var hCounter = counter.create('http');
	    return {
	        request: function (config) {
	            hCounter.incr();
	            return $q.when(config);
	        },
	        requestError: function (rejection) {
	            hCounter.decr();
	            return $q.reject(rejection);
	        },
	        response: function (response) {
	            hCounter.decr();
	            return $q.when(response);
	        },
	        responseError: function (response) {
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
	var logDecorator = function ($delegate, $window) {
	    if (typeof window['onServer'] !== 'undefined' && window['onServer'] === true && typeof window['fs'] !== 'undefined' && typeof window['logConfig'] !== 'undefined') {
	        var fs_1 = window['fs'];
	        var config_1 = window['logConfig'];
	        var formatMsg_1 = function (msg) {
	            var date = new Date();
	            return date + " -> " + msg.join(' ') + '\n';
	        };
	        var log_1 = function (type) {
	            var args = [];
	            for (var _i = 1; _i < arguments.length; _i++) {
	                args[_i - 1] = arguments[_i];
	            }
	            if (config_1[type].enabled) {
	                var msg = formatMsg_1(args);
	                if (config_1[type].stack === true) {
	                    var err = new Error();
	                    var stack = err['stack'];
	                    msg += stack + '\n\n';
	                }
	                fs_1.appendFile(config_1.dir + '/' + type, msg, function (err) {
	                    if (err)
	                        throw err;
	                });
	            }
	            else {
	                $delegate[type].apply($window.console, args);
	            }
	        };
	        var timer = Date.now();
	        var myLog = {
	            formatMsg: formatMsg_1,
	            warn: function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                log_1('warn', args);
	            },
	            error: function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                log_1('error', args);
	            },
	            info: function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                log_1('info', args);
	            },
	            debug: function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                log_1('debug', args);
	            },
	            log: function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                log_1('log', args);
	            },
	            dev: function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                return;
	            }
	        };
	        return myLog;
	    }
	    else {
	        return $delegate;
	    }
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
	            doneCB = function () { };
	        }
	        counters[name] = new Counter(name, doneCB, $rootScope, engineQueue, TimeoutValue, $log);
	        return counters[name];
	    };
	    var getCounter = function (name) {
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
	    return {
	        create: createCounter,
	        incr: incr,
	        decr: decr,
	        getCount: getCount
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
	        this.incr = function () {
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
//# sourceMappingURL=angular.js-server.js.map