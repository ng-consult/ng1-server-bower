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
	var timeoutValue_1 = __webpack_require__(7);
	var cacheFactory_1 = __webpack_require__(8);
	angular.module('server', [])
	    .provider('timeoutValue', timeoutValue_1.default)
	    .factory('counter', ['$rootScope', '$log', 'engineQueue', 'timeoutValue', Counter_1.default])
	    .factory('engineQueue', ['$log', '$rootScope', '$window', engineQueue_1.default])
	    .factory('httpInterceptorQueue', ['$q', '$log', 'counter', httpInterceptorQueue_1.default])
	    .decorator('$q', ['$delegate', 'counter', q2_1.default])
	    .decorator('$exceptionHandler', ['$delegate', '$window', exceptionHandler_1.default])
	    .decorator('$log', ['$delegate', '$window', log_1.default])
	    .decorator('$cacheFactory', ['$delegate', cacheFactory_1.CacheFactory])
	    .decorator('$templateCache', ['$cacheFactory', cacheFactory_1.TemplateCache])
	    .provider('cacheFactoryConfig', cacheFactory_1.CacheFactoryConfig)
	    .config(function ($httpProvider) {
	    $httpProvider.interceptors.push('httpInterceptorQueue');
	})
	    .run(function ($rootScope, $log, $window, $timeout, $http, $cacheFactory, cacheFactoryConfig, timeoutValue, counter) {
	    if (typeof $window.clientTimeoutValue === 'number') {
	        timeoutValue.set($window.clientTimeoutValue);
	    }
	    else {
	        timeoutValue.set(200);
	    }
	    counter.create('http');
	    counter.create('q');
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
	            $log.dev('index.ts', 'touching http and q');
	            counter.touch('http');
	            counter.touch('q');
	        }, timeoutValue.get());
	    });
	    $http.defaults.cache = true;
	    if ($window.onServer && $window.onServer === true) {
	        $window.$cacheFactory = $cacheFactory;
	    }
	    if (typeof $window.onServer === 'undefined' && typeof $window.$angularServerCache !== 'undefined') {
	        $cacheFactory.importAll($window.$angularServerCache);
	        var defaultCache = cacheFactoryConfig.getDefaultCache();
	        $rootScope.$on('InternIdle', function () {
	            if (defaultCache === false) {
	                $cacheFactory.delete('$http');
	                $http.defaults.cache = defaultCache;
	            }
	        });
	    }
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	var _this = this;
	var HttpInterceptorQueue = function ($q, $log, counter) {
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
	        $delegate.dev = function () { };
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
	        fs.appendFile(config.dir + '/dev', args.join(', ') + '\n', function (err) {
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
	var ExceptionHandler = function ($delegate, $window) {
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
	var EngineQueue = function ($log, $rootScope, $window) {
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
	            var Event_1 = $window['Event'];
	            var dispatchEvent_1 = $window.dispatchEvent;
	            var IdleEvent = new Event_1('Idle');
	            dispatchEvent_1(IdleEvent);
	            $rootScope.$broadcast('InternIdle');
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
	var Q = function ($delegate, counter) {
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
	var CounterFactory = function ($rootScope, $log, engineQueue, timeoutValue) {
	    var counters = {};
	    var createCounter = function (name, doneCB) {
	        if (!doneCB) {
	            doneCB = function () {
	            };
	        }
	        $log.dev('counter', 'creating counter', name);
	        counters[name] = new Counter(name, doneCB, $rootScope, engineQueue, timeoutValue.get(), $log);
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


/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	var TimeoutValueProvider = (function () {
	    function TimeoutValueProvider() {
	        var _this = this;
	        this.setTimeoutValue = function (value) {
	            _this.timeoutValue = value;
	        };
	        this.$get = function () {
	            return {
	                set: function (value) {
	                    _this.setTimeoutValue(value);
	                },
	                get: function () {
	                    return _this.timeoutValue;
	                }
	            };
	        };
	        this.timeoutValue = 200;
	    }
	    return TimeoutValueProvider;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = TimeoutValueProvider;


/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';
	var CacheData = (function () {
	    function CacheData(name) {
	        var _this = this;
	        this.name = name;
	        this.set = function (key) {
	            _this.data[key] = Date.now();
	        };
	        this.has = function (key) {
	            return typeof _this.data[key] !== 'undefined';
	        };
	        this.delete = function (key) {
	            if (_this.has(key)) {
	                delete _this.data[key];
	            }
	        };
	        this.keys = function () {
	            return _this.data;
	        };
	        this.empty = function () {
	            _this.data = {};
	        };
	        this.data = {};
	    }
	    return CacheData;
	}());
	exports.CacheFactory = function ($delegate) {
	    var caches = {};
	    var $cacheFactory = function (cacheId, options) {
	        var cache;
	        try {
	            cache = $delegate(cacheId, options);
	        }
	        catch (e) {
	            cache = $delegate.get(cacheId);
	        }
	        var Oput = cache.put;
	        var Oremove = cache.remove;
	        cache.put = function (key, value) {
	            caches[cacheId].set(key);
	            Oput.apply(cache, [key, value]);
	        };
	        cache.remove = function (key) {
	            caches[cacheId].delete(key);
	            Oremove.apply(cache, [key]);
	        };
	        caches[cacheId] = new CacheData(cacheId);
	        return cache;
	    };
	    $cacheFactory.prototype = $delegate.prototype;
	    $cacheFactory.export = function (cacheId) {
	        if (typeof caches[cacheId] === 'undefined') {
	            throw new Error('$cacheFactory - iid - CacheId ' + cacheId + ' is not defined!');
	        }
	        var data = {};
	        var cache = caches[cacheId];
	        var storedCache = $delegate.get(cacheId);
	        var keys = cache.keys();
	        for (var key in keys) {
	            data[key] = storedCache.get(key);
	        }
	        return data;
	    };
	    $cacheFactory.exportAll = function () {
	        var data = {};
	        for (var cacheId in caches) {
	            data[cacheId] = $cacheFactory.export(cacheId);
	        }
	        return data;
	    };
	    $cacheFactory.import = function (cacheId, data) {
	        if (typeof caches[cacheId] === 'undefined') {
	            $cacheFactory(cacheId, {});
	        }
	        var storedCache = $delegate.get(cacheId);
	        for (var key in data) {
	            storedCache.put(key, data[key]);
	        }
	    };
	    $cacheFactory.importAll = function (data) {
	        for (var key in data) {
	            $cacheFactory.import(key, data[key]);
	        }
	    };
	    $cacheFactory.delete = function (cacheId) {
	        if (typeof caches[cacheId] !== 'undefined') {
	            var storedCache = $delegate.get(cacheId);
	            storedCache.removeAll();
	            storedCache.destroy();
	            delete caches[cacheId];
	        }
	    };
	    $cacheFactory.get = $delegate.get;
	    $cacheFactory.info = $delegate.info;
	    return $cacheFactory;
	};
	exports.TemplateCache = function ($cacheFactory) {
	    return $cacheFactory('templates');
	};
	var CacheFactoryConfig = (function () {
	    function CacheFactoryConfig() {
	        var _this = this;
	        this.$get = function () {
	            return {
	                setDefaultCache: function (value) {
	                    _this.defaultCache = value;
	                },
	                getDefaultCache: function () {
	                    return _this.defaultCache;
	                }
	            };
	        };
	        this.defaultCache = true;
	    }
	    return CacheFactoryConfig;
	}());
	exports.CacheFactoryConfig = CacheFactoryConfig;


/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNTI5M2ZlN2ZmMGY3ZjUzM2MwYTEiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovLy8uL3NyYy9mYWN0b3J5L2h0dHBJbnRlcmNlcHRvclF1ZXVlLnRzIiwid2VicGFjazovLy8uL3NyYy9kZWNvcmF0b3IvbG9nLnRzIiwid2VicGFjazovLy8uL3NyYy9kZWNvcmF0b3IvZXhjZXB0aW9uSGFuZGxlci50cyIsIndlYnBhY2s6Ly8vLi9zcmMvZmFjdG9yeS9lbmdpbmVRdWV1ZS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvZGVjb3JhdG9yL3EyLnRzIiwid2VicGFjazovLy8uL3NyYy9mYWN0b3J5L0NvdW50ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3Byb3ZpZGVyL3RpbWVvdXRWYWx1ZS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvZGVjb3JhdG9yL2NhY2hlRmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBLEVBQUM7Ozs7Ozs7QUMvREQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQThDLGNBQWM7QUFDNUQ7Ozs7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0Esa0NBQWlDLHlDQUF5QztBQUMxRSxrR0FBaUc7QUFDakc7QUFDQSxzQ0FBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBd0IsdUJBQXVCO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXdCLHVCQUF1QjtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFnQyx1QkFBdUI7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBLHlCQUF3Qix1QkFBdUI7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBOEMsY0FBYztBQUM1RDs7Ozs7OztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUE4QyxjQUFjO0FBQzVEOzs7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBOEMsY0FBYztBQUM1RDs7Ozs7OztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUE4QyxjQUFjO0FBQzVEOzs7Ozs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFDO0FBQ0QsK0NBQThDLGNBQWM7QUFDNUQ7Ozs7Ozs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQztBQUNELCtDQUE4QyxjQUFjO0FBQzVEOzs7Ozs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXFDO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQztBQUNEIiwiZmlsZSI6ImRpc3QvYW5ndWxhci5qcy1zZXJ2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDUyOTNmZTdmZjBmN2Y1MzNjMGExXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgaHR0cEludGVyY2VwdG9yUXVldWVfMSA9IHJlcXVpcmUoJy4vZmFjdG9yeS9odHRwSW50ZXJjZXB0b3JRdWV1ZScpO1xudmFyIGxvZ18xID0gcmVxdWlyZSgnLi9kZWNvcmF0b3IvbG9nJyk7XG52YXIgZXhjZXB0aW9uSGFuZGxlcl8xID0gcmVxdWlyZSgnLi9kZWNvcmF0b3IvZXhjZXB0aW9uSGFuZGxlcicpO1xudmFyIGVuZ2luZVF1ZXVlXzEgPSByZXF1aXJlKCcuL2ZhY3RvcnkvZW5naW5lUXVldWUnKTtcbnZhciBxMl8xID0gcmVxdWlyZSgnLi9kZWNvcmF0b3IvcTInKTtcbnZhciBDb3VudGVyXzEgPSByZXF1aXJlKCcuL2ZhY3RvcnkvQ291bnRlcicpO1xudmFyIHRpbWVvdXRWYWx1ZV8xID0gcmVxdWlyZSgnLi9wcm92aWRlci90aW1lb3V0VmFsdWUnKTtcbnZhciBjYWNoZUZhY3RvcnlfMSA9IHJlcXVpcmUoJy4vZGVjb3JhdG9yL2NhY2hlRmFjdG9yeScpO1xuYW5ndWxhci5tb2R1bGUoJ3NlcnZlcicsIFtdKVxuICAgIC5wcm92aWRlcigndGltZW91dFZhbHVlJywgdGltZW91dFZhbHVlXzEuZGVmYXVsdClcbiAgICAuZmFjdG9yeSgnY291bnRlcicsIFsnJHJvb3RTY29wZScsICckbG9nJywgJ2VuZ2luZVF1ZXVlJywgJ3RpbWVvdXRWYWx1ZScsIENvdW50ZXJfMS5kZWZhdWx0XSlcbiAgICAuZmFjdG9yeSgnZW5naW5lUXVldWUnLCBbJyRsb2cnLCAnJHJvb3RTY29wZScsICckd2luZG93JywgZW5naW5lUXVldWVfMS5kZWZhdWx0XSlcbiAgICAuZmFjdG9yeSgnaHR0cEludGVyY2VwdG9yUXVldWUnLCBbJyRxJywgJyRsb2cnLCAnY291bnRlcicsIGh0dHBJbnRlcmNlcHRvclF1ZXVlXzEuZGVmYXVsdF0pXG4gICAgLmRlY29yYXRvcignJHEnLCBbJyRkZWxlZ2F0ZScsICdjb3VudGVyJywgcTJfMS5kZWZhdWx0XSlcbiAgICAuZGVjb3JhdG9yKCckZXhjZXB0aW9uSGFuZGxlcicsIFsnJGRlbGVnYXRlJywgJyR3aW5kb3cnLCBleGNlcHRpb25IYW5kbGVyXzEuZGVmYXVsdF0pXG4gICAgLmRlY29yYXRvcignJGxvZycsIFsnJGRlbGVnYXRlJywgJyR3aW5kb3cnLCBsb2dfMS5kZWZhdWx0XSlcbiAgICAuZGVjb3JhdG9yKCckY2FjaGVGYWN0b3J5JywgWyckZGVsZWdhdGUnLCBjYWNoZUZhY3RvcnlfMS5DYWNoZUZhY3RvcnldKVxuICAgIC5kZWNvcmF0b3IoJyR0ZW1wbGF0ZUNhY2hlJywgWyckY2FjaGVGYWN0b3J5JywgY2FjaGVGYWN0b3J5XzEuVGVtcGxhdGVDYWNoZV0pXG4gICAgLnByb3ZpZGVyKCdjYWNoZUZhY3RvcnlDb25maWcnLCBjYWNoZUZhY3RvcnlfMS5DYWNoZUZhY3RvcnlDb25maWcpXG4gICAgLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ2h0dHBJbnRlcmNlcHRvclF1ZXVlJyk7XG59KVxuICAgIC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsICRsb2csICR3aW5kb3csICR0aW1lb3V0LCAkaHR0cCwgJGNhY2hlRmFjdG9yeSwgY2FjaGVGYWN0b3J5Q29uZmlnLCB0aW1lb3V0VmFsdWUsIGNvdW50ZXIpIHtcbiAgICBpZiAodHlwZW9mICR3aW5kb3cuY2xpZW50VGltZW91dFZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICB0aW1lb3V0VmFsdWUuc2V0KCR3aW5kb3cuY2xpZW50VGltZW91dFZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRpbWVvdXRWYWx1ZS5zZXQoMjAwKTtcbiAgICB9XG4gICAgY291bnRlci5jcmVhdGUoJ2h0dHAnKTtcbiAgICBjb3VudGVyLmNyZWF0ZSgncScpO1xuICAgIGNvdW50ZXIuY3JlYXRlKCdkaWdlc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRsb2cuZGV2KCdydW4nLCAnZGlnZXN0V2F0Y2hlciBjbGVhbnVwJywgZGlnZXN0V2F0Y2hlcik7XG4gICAgICAgIGRpZ2VzdFdhdGNoZXIoKTtcbiAgICB9KTtcbiAgICB2YXIgZGlnZXN0V2F0Y2hlciA9ICRyb290U2NvcGUuJHdhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY291bnRlci5pbmNyKCdkaWdlc3QnKTtcbiAgICAgICAgJHJvb3RTY29wZS4kJHBvc3REaWdlc3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY291bnRlci5kZWNyKCdkaWdlc3QnKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkbG9nLmRldignaW5kZXgudHMnLCAndG91Y2hpbmcgaHR0cCBhbmQgcScpO1xuICAgICAgICAgICAgY291bnRlci50b3VjaCgnaHR0cCcpO1xuICAgICAgICAgICAgY291bnRlci50b3VjaCgncScpO1xuICAgICAgICB9LCB0aW1lb3V0VmFsdWUuZ2V0KCkpO1xuICAgIH0pO1xuICAgICRodHRwLmRlZmF1bHRzLmNhY2hlID0gdHJ1ZTtcbiAgICBpZiAoJHdpbmRvdy5vblNlcnZlciAmJiAkd2luZG93Lm9uU2VydmVyID09PSB0cnVlKSB7XG4gICAgICAgICR3aW5kb3cuJGNhY2hlRmFjdG9yeSA9ICRjYWNoZUZhY3Rvcnk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgJHdpbmRvdy5vblNlcnZlciA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mICR3aW5kb3cuJGFuZ3VsYXJTZXJ2ZXJDYWNoZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgJGNhY2hlRmFjdG9yeS5pbXBvcnRBbGwoJHdpbmRvdy4kYW5ndWxhclNlcnZlckNhY2hlKTtcbiAgICAgICAgdmFyIGRlZmF1bHRDYWNoZSA9IGNhY2hlRmFjdG9yeUNvbmZpZy5nZXREZWZhdWx0Q2FjaGUoKTtcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ0ludGVybklkbGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoZGVmYXVsdENhY2hlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICRjYWNoZUZhY3RvcnkuZGVsZXRlKCckaHR0cCcpO1xuICAgICAgICAgICAgICAgICRodHRwLmRlZmF1bHRzLmNhY2hlID0gZGVmYXVsdENhY2hlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvaW5kZXgudHNcbiAqKiBtb2R1bGUgaWQgPSAwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG52YXIgX3RoaXMgPSB0aGlzO1xudmFyIEh0dHBJbnRlcmNlcHRvclF1ZXVlID0gZnVuY3Rpb24gKCRxLCAkbG9nLCBjb3VudGVyKSB7XG4gICAgJGxvZy5kZXYoJ0h0dHBJbnRlcmNlcHRvcicsICdpbnN0YW5jaWF0ZWQnLCBfdGhpcyk7XG4gICAgdmFyIGhDb3VudGVyID0gY291bnRlci5jcmVhdGUoJ2h0dHAnKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAkbG9nLmRldignaHR0cFJlcXVlc3QnLCBjb25maWcudXJsKTtcbiAgICAgICAgICAgIGhDb3VudGVyLmluY3IoKTtcbiAgICAgICAgICAgIHJldHVybiAkcS53aGVuKGNvbmZpZyk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RFcnJvcjogZnVuY3Rpb24gKHJlamVjdGlvbikge1xuICAgICAgICAgICAgaENvdW50ZXIuZGVjcigpO1xuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgICB9LFxuICAgICAgICByZXNwb25zZTogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAkbG9nLmRldignaHR0cFJlc3BvbnNlJywgcmVzcG9uc2UuY29uZmlnLnVybCk7XG4gICAgICAgICAgICBoQ291bnRlci5kZWNyKCk7XG4gICAgICAgICAgICByZXR1cm4gJHEud2hlbihyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgJGxvZy5kZXYoJ2h0dHBSZXNwb25zZScsIHJlc3BvbnNlLmNvbmZpZy51cmwpO1xuICAgICAgICAgICAgaENvdW50ZXIuZGVjcigpO1xuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEh0dHBJbnRlcmNlcHRvclF1ZXVlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9mYWN0b3J5L2h0dHBJbnRlcmNlcHRvclF1ZXVlLnRzXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyIF90aGlzID0gdGhpcztcbnZhciBsb2dEZWNvcmF0b3IgPSBmdW5jdGlvbiAoJGRlbGVnYXRlLCAkd2luZG93KSB7XG4gICAgdmFyIGlzRGVmID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIGFuZ3VsYXIuaXNEZWZpbmVkKCR3aW5kb3dbbmFtZV0pOyB9O1xuICAgIGlmIChpc0RlZignb25TZXJ2ZXInKSAmJiBpc0RlZignZnMnKSAmJiBpc0RlZignbG9nQ29uZmlnJykgJiYgJHdpbmRvd1snb25TZXJ2ZXInXSA9PT0gdHJ1ZSkgeyB9XG4gICAgZWxzZSB7XG4gICAgICAgICRkZWxlZ2F0ZS5kZXYgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgfVxuICAgIHZhciBmcyA9ICR3aW5kb3dbJ2ZzJ107XG4gICAgdmFyIGNvbmZpZyA9ICR3aW5kb3dbJ2xvZ0NvbmZpZyddO1xuICAgIHZhciB0aW1lciA9IERhdGUubm93KCk7XG4gICAgdmFyIGZvcm1hdE1zZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0ciA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgc3RyW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgcmV0dXJuIGRhdGUgKyBcIiAtPiBcIiArIHN0ci5qb2luKCcgJykgKyAnXFxuJztcbiAgICB9O1xuICAgIHZhciBkZXZMb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0aW1lID0gRGF0ZS5ub3coKSAtIHRpbWVyO1xuICAgICAgICB0aW1lciA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBuYW1lID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBhcmdzLnVuc2hpZnQobmFtZSArICcrJyArIHRpbWUpO1xuICAgICAgICBmcy5hcHBlbmRGaWxlKGNvbmZpZy5kaXIgKyAnL2RldicsIGFyZ3Muam9pbignLCAnKSArICdcXG4nLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcuYXBwbHkoX3RoaXMsIGFyZ3MpO1xuICAgIH07XG4gICAgdmFyIG5ld0xvZyA9IE9iamVjdC5jcmVhdGUoJGRlbGVnYXRlKTtcbiAgICBuZXdMb2cucHJvdG90eXBlID0gJGRlbGVnYXRlLnByb3RvdHlwZTtcbiAgICBbJ2xvZycsICd3YXJuJywgJ2luZm8nLCAnZXJyb3InLCAnZGVidWcnXS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIGlmIChjb25maWdbaXRlbV0uZW5hYmxlZCkge1xuICAgICAgICAgICAgbmV3TG9nW2l0ZW1dID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IGZvcm1hdE1zZy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnW2l0ZW1dLnN0YWNrID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YWNrID0gZXJyWydzdGFjayddO1xuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gc3RhY2sgKyAnXFxuXFxuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnMuYXBwZW5kRmlsZShjb25maWcuZGlyICsgJy8nICsgaXRlbSwgbXNnLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBPYmplY3QoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXdMb2dbaXRlbV0gPSAkZGVsZWdhdGVbaXRlbV07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBuZXdMb2dbJ2RldiddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHdpbmRvd1snc2VydmVyRGVidWcnXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuc2VydmVyRGVidWcgPT09IHRydWUgJiYgYXJnc1swXSAhPT0gJ2RpZ2VzdCcpIHtcbiAgICAgICAgICAgICAgICBkZXZMb2cuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgJHdpbmRvdy5zZXJ2ZXJEZWJ1Zy5kaWdlc3QgPT09ICdib29sZWFuJyAmJiAkd2luZG93LnNlcnZlckRlYnVnLmRpZ2VzdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGRldkxvZy5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIG5ld0xvZztcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBsb2dEZWNvcmF0b3I7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2RlY29yYXRvci9sb2cudHNcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG52YXIgRXhjZXB0aW9uSGFuZGxlciA9IGZ1bmN0aW9uICgkZGVsZWdhdGUsICR3aW5kb3cpIHtcbiAgICB2YXIgZXJyb3JIYW5kbGVyID0gZnVuY3Rpb24gKGVycm9yLCBjYXVzZSkge1xuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgICAgIHZhciBzdGFjayA9IGVyclsnc3RhY2snXTtcbiAgICAgICAgdmFyIGVycm9yRXZlbnQgPSBuZXcgJHdpbmRvdy5DdXN0b21FdmVudCgnU2VydmVyRXhjZXB0aW9uSGFuZGxlcicpO1xuICAgICAgICBlcnJvckV2ZW50LmRldGFpbHMgPSB7XG4gICAgICAgICAgICBleGNlcHRpb246IGVycm9yLFxuICAgICAgICAgICAgY2F1c2U6IGNhdXNlLFxuICAgICAgICAgICAgZXJyOiBzdGFja1xuICAgICAgICB9O1xuICAgICAgICAkd2luZG93LmRpc3BhdGNoRXZlbnQoZXJyb3JFdmVudCk7XG4gICAgICAgIHJldHVybiAkZGVsZWdhdGUoZXJyb3IsIGNhdXNlKTtcbiAgICB9O1xuICAgIHJldHVybiBlcnJvckhhbmRsZXI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRXhjZXB0aW9uSGFuZGxlcjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvZGVjb3JhdG9yL2V4Y2VwdGlvbkhhbmRsZXIudHNcbiAqKiBtb2R1bGUgaWQgPSAzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBFbmdpbmVRdWV1ZSA9IGZ1bmN0aW9uICgkbG9nLCAkcm9vdFNjb3BlLCAkd2luZG93KSB7XG4gICAgdmFyIGRvbmVWYXIgPSB7fTtcbiAgICB2YXIgc2V0U3RhdHVzID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIGlmIChpc0RvbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkb25lVmFyW25hbWVdID0gdmFsdWU7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgZG9uZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIGlzRG9uZSA9IGZhbHNlO1xuICAgIHZhciBhcmVEb25lVmFyQWxsVHJ1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRvbmVWYXIpIHtcbiAgICAgICAgICAgIGlmICghZG9uZVZhcltrZXldKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoZnJvbSkge1xuICAgICAgICAkbG9nLmRldignZW5naW5lUXVldWUuaXNEb25lKCknLCBmcm9tLCBkb25lVmFyKTtcbiAgICAgICAgaWYgKGlzRG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIGlzRG9uZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJlRG9uZVZhckFsbFRydWUoKSkge1xuICAgICAgICAgICAgaXNEb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBFdmVudF8xID0gJHdpbmRvd1snRXZlbnQnXTtcbiAgICAgICAgICAgIHZhciBkaXNwYXRjaEV2ZW50XzEgPSAkd2luZG93LmRpc3BhdGNoRXZlbnQ7XG4gICAgICAgICAgICB2YXIgSWRsZUV2ZW50ID0gbmV3IEV2ZW50XzEoJ0lkbGUnKTtcbiAgICAgICAgICAgIGRpc3BhdGNoRXZlbnRfMShJZGxlRXZlbnQpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdJbnRlcm5JZGxlJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzRG9uZTtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGlzRG9uZTogZG9uZSxcbiAgICAgICAgc2V0U3RhdHVzOiBzZXRTdGF0dXNcbiAgICB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEVuZ2luZVF1ZXVlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9mYWN0b3J5L2VuZ2luZVF1ZXVlLnRzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyIFEgPSBmdW5jdGlvbiAoJGRlbGVnYXRlLCBjb3VudGVyKSB7XG4gICAgdmFyIHFDb3VudGVyID0gY291bnRlci5jcmVhdGUoJ3EnKTtcbiAgICB2YXIgcHJvdG8gPSAkZGVsZWdhdGUucHJvdG90eXBlO1xuICAgIHZhciBPZGVmZXIgPSAkZGVsZWdhdGUuZGVmZXI7XG4gICAgdmFyIE9yZWplY3QgPSAkZGVsZWdhdGUucmVqZWN0O1xuICAgIHZhciBPcmFjZSA9ICRkZWxlZ2F0ZS5yYWNlO1xuICAgIHZhciBPYWxsID0gJGRlbGVnYXRlLmFsbDtcbiAgICB2YXIgT3Jlc29sdmUgPSAkZGVsZWdhdGUucmVzb2x2ZTtcbiAgICB2YXIgZGVmZXJGbiA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSBPZGVmZXIuYXBwbHkoY29udGV4dCwgW10pO1xuICAgICAgICAgICAgdmFyIG9yaWdpbmFsRGVmZXJSZXNvbHZlID0gZGVmZXJyZWQucmVzb2x2ZTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcUNvdW50ZXIuZGVjcigpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbERlZmVyUmVzb2x2ZS5hcHBseShkZWZlcnJlZCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgb3JpZ2luYWxEZWZlclJlamVjdCA9IGRlZmVycmVkLnJlamVjdDtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxQ291bnRlci5kZWNyKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsRGVmZXJSZWplY3QuYXBwbHkoZGVmZXJyZWQsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcUNvdW50ZXIuaW5jcigpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgdmFyICRRID0gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm9yc2x2ciAtIEV4cGVjdGVkIHJlc29sdmVyRm4sIGdvdCAtIHJlc29sdmVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXJGbih0aGlzKSgpO1xuICAgICAgICBmdW5jdGlvbiByZXNvbHZlRm4odmFsdWUpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdEZuKHJlYXNvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZXIocmVzb2x2ZUZuLCByZWplY3RGbik7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gICAgJFEucHJvdG90eXBlID0gcHJvdG87XG4gICAgJFEuZGVmZXIgPSBkZWZlckZuKCRkZWxlZ2F0ZSk7XG4gICAgJFEucmVqZWN0ID0gJGRlbGVnYXRlLnJlamVjdDtcbiAgICAkUS53aGVuID0gJGRlbGVnYXRlLndoZW47XG4gICAgJFEucmVzb2x2ZSA9IE9yZXNvbHZlO1xuICAgICRRLmFsbCA9IE9hbGw7XG4gICAgJFEucmFjZSA9IE9yYWNlO1xuICAgIHJldHVybiAkUTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBRO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9kZWNvcmF0b3IvcTIudHNcbiAqKiBtb2R1bGUgaWQgPSA1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBDb3VudGVyRmFjdG9yeSA9IGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkbG9nLCBlbmdpbmVRdWV1ZSwgdGltZW91dFZhbHVlKSB7XG4gICAgdmFyIGNvdW50ZXJzID0ge307XG4gICAgdmFyIGNyZWF0ZUNvdW50ZXIgPSBmdW5jdGlvbiAobmFtZSwgZG9uZUNCKSB7XG4gICAgICAgIGlmICghZG9uZUNCKSB7XG4gICAgICAgICAgICBkb25lQ0IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRsb2cuZGV2KCdjb3VudGVyJywgJ2NyZWF0aW5nIGNvdW50ZXInLCBuYW1lKTtcbiAgICAgICAgY291bnRlcnNbbmFtZV0gPSBuZXcgQ291bnRlcihuYW1lLCBkb25lQ0IsICRyb290U2NvcGUsIGVuZ2luZVF1ZXVlLCB0aW1lb3V0VmFsdWUuZ2V0KCksICRsb2cpO1xuICAgICAgICByZXR1cm4gY291bnRlcnNbbmFtZV07XG4gICAgfTtcbiAgICB2YXIgaW5jciA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGNvdW50ZXJzW25hbWVdLmluY3IoKTtcbiAgICB9O1xuICAgIHZhciBkZWNyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgY291bnRlcnNbbmFtZV0uZGVjcigpO1xuICAgIH07XG4gICAgdmFyIGdldENvdW50ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGNvdW50ZXJzW25hbWVdLmdldENvdW50KCk7XG4gICAgfTtcbiAgICB2YXIgdG91Y2ggPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBjb3VudGVyc1tuYW1lXS50b3VjaCgpO1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlOiBjcmVhdGVDb3VudGVyLFxuICAgICAgICBpbmNyOiBpbmNyLFxuICAgICAgICBkZWNyOiBkZWNyLFxuICAgICAgICBnZXRDb3VudDogZ2V0Q291bnQsXG4gICAgICAgIHRvdWNoOiB0b3VjaFxuICAgIH07XG59O1xudmFyIENvdW50ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvdW50ZXIobmFtZSwgZG9uZUNCLCAkcm9vdFNjb3BlLCBlbmdpbmVRdWV1ZSwgVGltZW91dFZhbHVlLCAkbG9nKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9uZUNCID0gZG9uZUNCO1xuICAgICAgICB0aGlzLiRyb290U2NvcGUgPSAkcm9vdFNjb3BlO1xuICAgICAgICB0aGlzLmVuZ2luZVF1ZXVlID0gZW5naW5lUXVldWU7XG4gICAgICAgIHRoaXMuVGltZW91dFZhbHVlID0gVGltZW91dFZhbHVlO1xuICAgICAgICB0aGlzLiRsb2cgPSAkbG9nO1xuICAgICAgICB0aGlzLnVudG91Y2hlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGltZXIgPSBEYXRlLm5vdygpO1xuICAgICAgICB0aGlzLmdldENvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLmNvdW50O1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmlzRG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5kb25lO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNsZWFyVGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMudGltZW91dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gd2luZG93LmNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICBfdGhpcy4kbG9nLmRldihfdGhpcy5uYW1lLCAnVGltZW91dCBjbGVhcmVkJywgX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudG91Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy4kbG9nLmRldignQ291bnRlciAnICsgX3RoaXMubmFtZSwgJ2lzIGdldHRpbmcgdG91Y2hlZCcpO1xuICAgICAgICAgICAgaWYgKF90aGlzLnVudG91Y2hlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KCdDb3VudGVyICcgKyBfdGhpcy5uYW1lLCAnaGFzIGJlZW4gdG91Y2hlZCcsIF90aGlzLnVudG91Y2hlZCwgX3RoaXMuZ2V0Q291bnQoKSk7XG4gICAgICAgICAgICAgICAgX3RoaXMuZW5naW5lUXVldWUuc2V0U3RhdHVzKF90aGlzLm5hbWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIF90aGlzLnVudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIF90aGlzLnRyaWdnZXJJZGxlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBfdGhpcy4kbG9nLmRldignQ291bnRlciAnICsgX3RoaXMubmFtZSwgJ3dvbnQgZ2V0IHRvdWNoZWQnLCBfdGhpcy51bnRvdWNoZWQsIF90aGlzLmdldENvdW50KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmluY3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy51bnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChfdGhpcy5kb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuY291bnQrKztcbiAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KF90aGlzLm5hbWUsICdJbmNyZW1lbnRpbmcgY291bnRlciAnLCBfdGhpcy5jb3VudCk7XG4gICAgICAgICAgICBfdGhpcy5lbmdpbmVRdWV1ZS5zZXRTdGF0dXMoX3RoaXMubmFtZSwgZmFsc2UpO1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJUaW1lb3V0KCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGVjciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5kb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuY291bnQtLTtcbiAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KF90aGlzLm5hbWUsICdEZWNyZW1lbnRpbmcgY291bnRlciAnLCBfdGhpcy5jb3VudCk7XG4gICAgICAgICAgICBfdGhpcy5lbmdpbmVRdWV1ZS5zZXRTdGF0dXMoX3RoaXMubmFtZSwgZmFsc2UpO1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJUaW1lb3V0KCk7XG4gICAgICAgICAgICBpZiAoX3RoaXMuY291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VySWRsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRyaWdnZXJJZGxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJUaW1lb3V0KCk7XG4gICAgICAgICAgICBfdGhpcy4kbG9nLmRldihfdGhpcy5uYW1lLCAndHJpZ2dlcklkbGUgY2FsbGVkJywgX3RoaXMuY291bnQsIF90aGlzLlRpbWVvdXRWYWx1ZSk7XG4gICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKF90aGlzLmNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KF90aGlzLm5hbWUsICdzZXR0aW5nIHRoZSBkb25lVmFyIHRvIHRydWUnLCBfdGhpcy5jb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmVuZ2luZVF1ZXVlLnNldFN0YXR1cyhfdGhpcy5uYW1lLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzLmVuZ2luZVF1ZXVlLmlzRG9uZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KF90aGlzLm5hbWUsICdjYWxsaW5nIENCKCknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRvbmVDQigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kbG9nLmRldihfdGhpcy5uYW1lLCAndHJpZ2dlcklkbGUgY2FuY2VsbGVkICcsIF90aGlzLmNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZW5naW5lUXVldWUuc2V0U3RhdHVzKF90aGlzLm5hbWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBfdGhpcy5UaW1lb3V0VmFsdWUpO1xuICAgICAgICAgICAgX3RoaXMuJGxvZy5kZXYoX3RoaXMubmFtZSwgJ3RpbWVvdXQgc2V0IHRvJywgX3RoaXMudGltZW91dCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5lbmdpbmVRdWV1ZS5zZXRTdGF0dXModGhpcy5uYW1lLCBmYWxzZSk7XG4gICAgICAgICRsb2cuZGV2KCdjb3VudGVyJywgJ2NvbnN0cnVjdG9yIGNhbGxlZCcsIHRoaXMubmFtZSk7XG4gICAgfVxuICAgIHJldHVybiBDb3VudGVyO1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IENvdW50ZXJGYWN0b3J5O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9mYWN0b3J5L0NvdW50ZXIudHNcbiAqKiBtb2R1bGUgaWQgPSA2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBUaW1lb3V0VmFsdWVQcm92aWRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGltZW91dFZhbHVlUHJvdmlkZXIoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2V0VGltZW91dFZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBfdGhpcy50aW1lb3V0VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy4kZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zZXRUaW1lb3V0VmFsdWUodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy50aW1lb3V0VmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy50aW1lb3V0VmFsdWUgPSAyMDA7XG4gICAgfVxuICAgIHJldHVybiBUaW1lb3V0VmFsdWVQcm92aWRlcjtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBUaW1lb3V0VmFsdWVQcm92aWRlcjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvcHJvdmlkZXIvdGltZW91dFZhbHVlLnRzXG4gKiogbW9kdWxlIGlkID0gN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyIENhY2hlRGF0YSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2FjaGVEYXRhKG5hbWUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBfdGhpcy5kYXRhW2tleV0gPSBEYXRlLm5vdygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgX3RoaXMuZGF0YVtrZXldICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kZWxldGUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgX3RoaXMuZGF0YVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmtleXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuZGF0YTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLmRhdGEgPSB7fTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kYXRhID0ge307XG4gICAgfVxuICAgIHJldHVybiBDYWNoZURhdGE7XG59KCkpO1xuZXhwb3J0cy5DYWNoZUZhY3RvcnkgPSBmdW5jdGlvbiAoJGRlbGVnYXRlKSB7XG4gICAgdmFyIGNhY2hlcyA9IHt9O1xuICAgIHZhciAkY2FjaGVGYWN0b3J5ID0gZnVuY3Rpb24gKGNhY2hlSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGNhY2hlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2FjaGUgPSAkZGVsZWdhdGUoY2FjaGVJZCwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNhY2hlID0gJGRlbGVnYXRlLmdldChjYWNoZUlkKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgT3B1dCA9IGNhY2hlLnB1dDtcbiAgICAgICAgdmFyIE9yZW1vdmUgPSBjYWNoZS5yZW1vdmU7XG4gICAgICAgIGNhY2hlLnB1dCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBjYWNoZXNbY2FjaGVJZF0uc2V0KGtleSk7XG4gICAgICAgICAgICBPcHV0LmFwcGx5KGNhY2hlLCBba2V5LCB2YWx1ZV0pO1xuICAgICAgICB9O1xuICAgICAgICBjYWNoZS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBjYWNoZXNbY2FjaGVJZF0uZGVsZXRlKGtleSk7XG4gICAgICAgICAgICBPcmVtb3ZlLmFwcGx5KGNhY2hlLCBba2V5XSk7XG4gICAgICAgIH07XG4gICAgICAgIGNhY2hlc1tjYWNoZUlkXSA9IG5ldyBDYWNoZURhdGEoY2FjaGVJZCk7XG4gICAgICAgIHJldHVybiBjYWNoZTtcbiAgICB9O1xuICAgICRjYWNoZUZhY3RvcnkucHJvdG90eXBlID0gJGRlbGVnYXRlLnByb3RvdHlwZTtcbiAgICAkY2FjaGVGYWN0b3J5LmV4cG9ydCA9IGZ1bmN0aW9uIChjYWNoZUlkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FjaGVzW2NhY2hlSWRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCckY2FjaGVGYWN0b3J5IC0gaWlkIC0gQ2FjaGVJZCAnICsgY2FjaGVJZCArICcgaXMgbm90IGRlZmluZWQhJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcbiAgICAgICAgdmFyIGNhY2hlID0gY2FjaGVzW2NhY2hlSWRdO1xuICAgICAgICB2YXIgc3RvcmVkQ2FjaGUgPSAkZGVsZWdhdGUuZ2V0KGNhY2hlSWQpO1xuICAgICAgICB2YXIga2V5cyA9IGNhY2hlLmtleXMoKTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGtleXMpIHtcbiAgICAgICAgICAgIGRhdGFba2V5XSA9IHN0b3JlZENhY2hlLmdldChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG4gICAgJGNhY2hlRmFjdG9yeS5leHBvcnRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIGZvciAodmFyIGNhY2hlSWQgaW4gY2FjaGVzKSB7XG4gICAgICAgICAgICBkYXRhW2NhY2hlSWRdID0gJGNhY2hlRmFjdG9yeS5leHBvcnQoY2FjaGVJZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcbiAgICAkY2FjaGVGYWN0b3J5LmltcG9ydCA9IGZ1bmN0aW9uIChjYWNoZUlkLCBkYXRhKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FjaGVzW2NhY2hlSWRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgJGNhY2hlRmFjdG9yeShjYWNoZUlkLCB7fSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0b3JlZENhY2hlID0gJGRlbGVnYXRlLmdldChjYWNoZUlkKTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgIHN0b3JlZENhY2hlLnB1dChrZXksIGRhdGFba2V5XSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgICRjYWNoZUZhY3RvcnkuaW1wb3J0QWxsID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgICRjYWNoZUZhY3RvcnkuaW1wb3J0KGtleSwgZGF0YVtrZXldKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgJGNhY2hlRmFjdG9yeS5kZWxldGUgPSBmdW5jdGlvbiAoY2FjaGVJZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNhY2hlc1tjYWNoZUlkXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHZhciBzdG9yZWRDYWNoZSA9ICRkZWxlZ2F0ZS5nZXQoY2FjaGVJZCk7XG4gICAgICAgICAgICBzdG9yZWRDYWNoZS5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgIHN0b3JlZENhY2hlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjYWNoZXNbY2FjaGVJZF07XG4gICAgICAgIH1cbiAgICB9O1xuICAgICRjYWNoZUZhY3RvcnkuZ2V0ID0gJGRlbGVnYXRlLmdldDtcbiAgICAkY2FjaGVGYWN0b3J5LmluZm8gPSAkZGVsZWdhdGUuaW5mbztcbiAgICByZXR1cm4gJGNhY2hlRmFjdG9yeTtcbn07XG5leHBvcnRzLlRlbXBsYXRlQ2FjaGUgPSBmdW5jdGlvbiAoJGNhY2hlRmFjdG9yeSkge1xuICAgIHJldHVybiAkY2FjaGVGYWN0b3J5KCd0ZW1wbGF0ZXMnKTtcbn07XG52YXIgQ2FjaGVGYWN0b3J5Q29uZmlnID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDYWNoZUZhY3RvcnlDb25maWcoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuJGdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2V0RGVmYXVsdENhY2hlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGVmYXVsdENhY2hlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBnZXREZWZhdWx0Q2FjaGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmRlZmF1bHRDYWNoZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRlZmF1bHRDYWNoZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBDYWNoZUZhY3RvcnlDb25maWc7XG59KCkpO1xuZXhwb3J0cy5DYWNoZUZhY3RvcnlDb25maWcgPSBDYWNoZUZhY3RvcnlDb25maWc7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2RlY29yYXRvci9jYWNoZUZhY3RvcnkudHNcbiAqKiBtb2R1bGUgaWQgPSA4XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9