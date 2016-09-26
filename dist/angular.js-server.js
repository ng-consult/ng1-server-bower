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
	    console.debug('The Client is in the config() ');
	})
	    .run(function ($rootScope, $log, $window, $timeout, $http, $cacheFactory, cacheFactoryConfig, timeoutValue, counter) {
	    if (typeof $window.clientTimeoutValue === 'number') {
	        timeoutValue.set($window.clientTimeoutValue);
	    }
	    else {
	        timeoutValue.set(200);
	    }
	    var httpCouter = counter.create('http');
	    var qCounter = counter.create('q');
	    var digestCounter = counter.create('digest', function () {
	        $log.dev('run', 'digestWatcher cleanup', digestWatcher);
	        digestWatcher();
	    });
	    $timeout(function () {
	        $rootScope.$apply(function () {
	            $log.dev('index.ts', 'touching http and q');
	            httpCouter.touch();
	            qCounter.touch();
	        });
	    }, timeoutValue.get());
	    var digestWatcher = $rootScope.$watch(function () {
	        counter.incr('digest');
	        $rootScope.$$postDigest(function () {
	            counter.decr('digest');
	        });
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
	                fs.appendFile(config.dir + '/' + item + '.log', msg, function (err) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZTIzZjE2MGIyMzhiMzQ2NTk4MGMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovLy8uL3NyYy9mYWN0b3J5L2h0dHBJbnRlcmNlcHRvclF1ZXVlLnRzIiwid2VicGFjazovLy8uL3NyYy9kZWNvcmF0b3IvbG9nLnRzIiwid2VicGFjazovLy8uL3NyYy9kZWNvcmF0b3IvZXhjZXB0aW9uSGFuZGxlci50cyIsIndlYnBhY2s6Ly8vLi9zcmMvZmFjdG9yeS9lbmdpbmVRdWV1ZS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvZGVjb3JhdG9yL3EyLnRzIiwid2VicGFjazovLy8uL3NyYy9mYWN0b3J5L0NvdW50ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3Byb3ZpZGVyL3RpbWVvdXRWYWx1ZS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvZGVjb3JhdG9yL2NhY2hlRmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNULE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0EsRUFBQzs7Ozs7OztBQ2hFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBOEMsY0FBYztBQUM1RDs7Ozs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBaUMseUNBQXlDO0FBQzFFLGtHQUFpRztBQUNqRztBQUNBLHNDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF3Qix1QkFBdUI7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBd0IsdUJBQXVCO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWdDLHVCQUF1QjtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0EseUJBQXdCLHVCQUF1QjtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUE4QyxjQUFjO0FBQzVEOzs7Ozs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQThDLGNBQWM7QUFDNUQ7Ozs7Ozs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUE4QyxjQUFjO0FBQzVEOzs7Ozs7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQThDLGNBQWM7QUFDNUQ7Ozs7Ozs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQztBQUNELCtDQUE4QyxjQUFjO0FBQzVEOzs7Ozs7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7QUFDRCwrQ0FBOEMsY0FBYztBQUM1RDs7Ozs7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7QUFDRCIsImZpbGUiOiJkaXN0L2FuZ3VsYXIuanMtc2VydmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCBlMjNmMTYwYjIzOGIzNDY1OTgwY1xuICoqLyIsIlwidXNlIHN0cmljdFwiO1xudmFyIGh0dHBJbnRlcmNlcHRvclF1ZXVlXzEgPSByZXF1aXJlKCcuL2ZhY3RvcnkvaHR0cEludGVyY2VwdG9yUXVldWUnKTtcbnZhciBsb2dfMSA9IHJlcXVpcmUoJy4vZGVjb3JhdG9yL2xvZycpO1xudmFyIGV4Y2VwdGlvbkhhbmRsZXJfMSA9IHJlcXVpcmUoJy4vZGVjb3JhdG9yL2V4Y2VwdGlvbkhhbmRsZXInKTtcbnZhciBlbmdpbmVRdWV1ZV8xID0gcmVxdWlyZSgnLi9mYWN0b3J5L2VuZ2luZVF1ZXVlJyk7XG52YXIgcTJfMSA9IHJlcXVpcmUoJy4vZGVjb3JhdG9yL3EyJyk7XG52YXIgQ291bnRlcl8xID0gcmVxdWlyZSgnLi9mYWN0b3J5L0NvdW50ZXInKTtcbnZhciB0aW1lb3V0VmFsdWVfMSA9IHJlcXVpcmUoJy4vcHJvdmlkZXIvdGltZW91dFZhbHVlJyk7XG52YXIgY2FjaGVGYWN0b3J5XzEgPSByZXF1aXJlKCcuL2RlY29yYXRvci9jYWNoZUZhY3RvcnknKTtcbmFuZ3VsYXIubW9kdWxlKCdzZXJ2ZXInLCBbXSlcbiAgICAucHJvdmlkZXIoJ3RpbWVvdXRWYWx1ZScsIHRpbWVvdXRWYWx1ZV8xLmRlZmF1bHQpXG4gICAgLmZhY3RvcnkoJ2NvdW50ZXInLCBbJyRyb290U2NvcGUnLCAnJGxvZycsICdlbmdpbmVRdWV1ZScsICd0aW1lb3V0VmFsdWUnLCBDb3VudGVyXzEuZGVmYXVsdF0pXG4gICAgLmZhY3RvcnkoJ2VuZ2luZVF1ZXVlJywgWyckbG9nJywgJyRyb290U2NvcGUnLCAnJHdpbmRvdycsIGVuZ2luZVF1ZXVlXzEuZGVmYXVsdF0pXG4gICAgLmZhY3RvcnkoJ2h0dHBJbnRlcmNlcHRvclF1ZXVlJywgWyckcScsICckbG9nJywgJ2NvdW50ZXInLCBodHRwSW50ZXJjZXB0b3JRdWV1ZV8xLmRlZmF1bHRdKVxuICAgIC5kZWNvcmF0b3IoJyRxJywgWyckZGVsZWdhdGUnLCAnY291bnRlcicsIHEyXzEuZGVmYXVsdF0pXG4gICAgLmRlY29yYXRvcignJGV4Y2VwdGlvbkhhbmRsZXInLCBbJyRkZWxlZ2F0ZScsICckd2luZG93JywgZXhjZXB0aW9uSGFuZGxlcl8xLmRlZmF1bHRdKVxuICAgIC5kZWNvcmF0b3IoJyRsb2cnLCBbJyRkZWxlZ2F0ZScsICckd2luZG93JywgbG9nXzEuZGVmYXVsdF0pXG4gICAgLmRlY29yYXRvcignJGNhY2hlRmFjdG9yeScsIFsnJGRlbGVnYXRlJywgY2FjaGVGYWN0b3J5XzEuQ2FjaGVGYWN0b3J5XSlcbiAgICAuZGVjb3JhdG9yKCckdGVtcGxhdGVDYWNoZScsIFsnJGNhY2hlRmFjdG9yeScsIGNhY2hlRmFjdG9yeV8xLlRlbXBsYXRlQ2FjaGVdKVxuICAgIC5wcm92aWRlcignY2FjaGVGYWN0b3J5Q29uZmlnJywgY2FjaGVGYWN0b3J5XzEuQ2FjaGVGYWN0b3J5Q29uZmlnKVxuICAgIC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdodHRwSW50ZXJjZXB0b3JRdWV1ZScpO1xuICAgIGNvbnNvbGUuZGVidWcoJ1RoZSBDbGllbnQgaXMgaW4gdGhlIGNvbmZpZygpICcpO1xufSlcbiAgICAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkbG9nLCAkd2luZG93LCAkdGltZW91dCwgJGh0dHAsICRjYWNoZUZhY3RvcnksIGNhY2hlRmFjdG9yeUNvbmZpZywgdGltZW91dFZhbHVlLCBjb3VudGVyKSB7XG4gICAgaWYgKHR5cGVvZiAkd2luZG93LmNsaWVudFRpbWVvdXRWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdGltZW91dFZhbHVlLnNldCgkd2luZG93LmNsaWVudFRpbWVvdXRWYWx1ZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aW1lb3V0VmFsdWUuc2V0KDIwMCk7XG4gICAgfVxuICAgIHZhciBodHRwQ291dGVyID0gY291bnRlci5jcmVhdGUoJ2h0dHAnKTtcbiAgICB2YXIgcUNvdW50ZXIgPSBjb3VudGVyLmNyZWF0ZSgncScpO1xuICAgIHZhciBkaWdlc3RDb3VudGVyID0gY291bnRlci5jcmVhdGUoJ2RpZ2VzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGxvZy5kZXYoJ3J1bicsICdkaWdlc3RXYXRjaGVyIGNsZWFudXAnLCBkaWdlc3RXYXRjaGVyKTtcbiAgICAgICAgZGlnZXN0V2F0Y2hlcigpO1xuICAgIH0pO1xuICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJGxvZy5kZXYoJ2luZGV4LnRzJywgJ3RvdWNoaW5nIGh0dHAgYW5kIHEnKTtcbiAgICAgICAgICAgIGh0dHBDb3V0ZXIudG91Y2goKTtcbiAgICAgICAgICAgIHFDb3VudGVyLnRvdWNoKCk7XG4gICAgICAgIH0pO1xuICAgIH0sIHRpbWVvdXRWYWx1ZS5nZXQoKSk7XG4gICAgdmFyIGRpZ2VzdFdhdGNoZXIgPSAkcm9vdFNjb3BlLiR3YXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvdW50ZXIuaW5jcignZGlnZXN0Jyk7XG4gICAgICAgICRyb290U2NvcGUuJCRwb3N0RGlnZXN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvdW50ZXIuZGVjcignZGlnZXN0Jyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgICRodHRwLmRlZmF1bHRzLmNhY2hlID0gdHJ1ZTtcbiAgICBpZiAoJHdpbmRvdy5vblNlcnZlciAmJiAkd2luZG93Lm9uU2VydmVyID09PSB0cnVlKSB7XG4gICAgICAgICR3aW5kb3cuJGNhY2hlRmFjdG9yeSA9ICRjYWNoZUZhY3Rvcnk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgJHdpbmRvdy5vblNlcnZlciA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mICR3aW5kb3cuJGFuZ3VsYXJTZXJ2ZXJDYWNoZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgJGNhY2hlRmFjdG9yeS5pbXBvcnRBbGwoJHdpbmRvdy4kYW5ndWxhclNlcnZlckNhY2hlKTtcbiAgICAgICAgdmFyIGRlZmF1bHRDYWNoZSA9IGNhY2hlRmFjdG9yeUNvbmZpZy5nZXREZWZhdWx0Q2FjaGUoKTtcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ0ludGVybklkbGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoZGVmYXVsdENhY2hlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICRjYWNoZUZhY3RvcnkuZGVsZXRlKCckaHR0cCcpO1xuICAgICAgICAgICAgICAgICRodHRwLmRlZmF1bHRzLmNhY2hlID0gZGVmYXVsdENhY2hlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvaW5kZXgudHNcbiAqKiBtb2R1bGUgaWQgPSAwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG52YXIgX3RoaXMgPSB0aGlzO1xudmFyIEh0dHBJbnRlcmNlcHRvclF1ZXVlID0gZnVuY3Rpb24gKCRxLCAkbG9nLCBjb3VudGVyKSB7XG4gICAgJGxvZy5kZXYoJ0h0dHBJbnRlcmNlcHRvcicsICdpbnN0YW5jaWF0ZWQnLCBfdGhpcyk7XG4gICAgdmFyIGhDb3VudGVyID0gY291bnRlci5jcmVhdGUoJ2h0dHAnKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAkbG9nLmRldignaHR0cFJlcXVlc3QnLCBjb25maWcudXJsKTtcbiAgICAgICAgICAgIGhDb3VudGVyLmluY3IoKTtcbiAgICAgICAgICAgIHJldHVybiAkcS53aGVuKGNvbmZpZyk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RFcnJvcjogZnVuY3Rpb24gKHJlamVjdGlvbikge1xuICAgICAgICAgICAgaENvdW50ZXIuZGVjcigpO1xuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgICB9LFxuICAgICAgICByZXNwb25zZTogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAkbG9nLmRldignaHR0cFJlc3BvbnNlJywgcmVzcG9uc2UuY29uZmlnLnVybCk7XG4gICAgICAgICAgICBoQ291bnRlci5kZWNyKCk7XG4gICAgICAgICAgICByZXR1cm4gJHEud2hlbihyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgJGxvZy5kZXYoJ2h0dHBSZXNwb25zZScsIHJlc3BvbnNlLmNvbmZpZy51cmwpO1xuICAgICAgICAgICAgaENvdW50ZXIuZGVjcigpO1xuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEh0dHBJbnRlcmNlcHRvclF1ZXVlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9mYWN0b3J5L2h0dHBJbnRlcmNlcHRvclF1ZXVlLnRzXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyIF90aGlzID0gdGhpcztcbnZhciBsb2dEZWNvcmF0b3IgPSBmdW5jdGlvbiAoJGRlbGVnYXRlLCAkd2luZG93KSB7XG4gICAgdmFyIGlzRGVmID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIGFuZ3VsYXIuaXNEZWZpbmVkKCR3aW5kb3dbbmFtZV0pOyB9O1xuICAgIGlmIChpc0RlZignb25TZXJ2ZXInKSAmJiBpc0RlZignZnMnKSAmJiBpc0RlZignbG9nQ29uZmlnJykgJiYgJHdpbmRvd1snb25TZXJ2ZXInXSA9PT0gdHJ1ZSkgeyB9XG4gICAgZWxzZSB7XG4gICAgICAgICRkZWxlZ2F0ZS5kZXYgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgfVxuICAgIHZhciBmcyA9ICR3aW5kb3dbJ2ZzJ107XG4gICAgdmFyIGNvbmZpZyA9ICR3aW5kb3dbJ2xvZ0NvbmZpZyddO1xuICAgIHZhciB0aW1lciA9IERhdGUubm93KCk7XG4gICAgdmFyIGZvcm1hdE1zZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0ciA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgc3RyW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgcmV0dXJuIGRhdGUgKyBcIiAtPiBcIiArIHN0ci5qb2luKCcgJykgKyAnXFxuJztcbiAgICB9O1xuICAgIHZhciBkZXZMb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0aW1lID0gRGF0ZS5ub3coKSAtIHRpbWVyO1xuICAgICAgICB0aW1lciA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBuYW1lID0gYXJncy5zaGlmdCgpO1xuICAgICAgICBhcmdzLnVuc2hpZnQobmFtZSArICcrJyArIHRpbWUpO1xuICAgICAgICBmcy5hcHBlbmRGaWxlKGNvbmZpZy5kaXIgKyAnL2RldicsIGFyZ3Muam9pbignLCAnKSArICdcXG4nLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcuYXBwbHkoX3RoaXMsIGFyZ3MpO1xuICAgIH07XG4gICAgdmFyIG5ld0xvZyA9IE9iamVjdC5jcmVhdGUoJGRlbGVnYXRlKTtcbiAgICBuZXdMb2cucHJvdG90eXBlID0gJGRlbGVnYXRlLnByb3RvdHlwZTtcbiAgICBbJ2xvZycsICd3YXJuJywgJ2luZm8nLCAnZXJyb3InLCAnZGVidWcnXS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIGlmIChjb25maWdbaXRlbV0uZW5hYmxlZCkge1xuICAgICAgICAgICAgbmV3TG9nW2l0ZW1dID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IGZvcm1hdE1zZy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnW2l0ZW1dLnN0YWNrID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YWNrID0gZXJyWydzdGFjayddO1xuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gc3RhY2sgKyAnXFxuXFxuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnMuYXBwZW5kRmlsZShjb25maWcuZGlyICsgJy8nICsgaXRlbSArICcubG9nJywgbXNnLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBPYmplY3QoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXdMb2dbaXRlbV0gPSAkZGVsZWdhdGVbaXRlbV07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBuZXdMb2dbJ2RldiddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHdpbmRvd1snc2VydmVyRGVidWcnXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuc2VydmVyRGVidWcgPT09IHRydWUgJiYgYXJnc1swXSAhPT0gJ2RpZ2VzdCcpIHtcbiAgICAgICAgICAgICAgICBkZXZMb2cuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgJHdpbmRvdy5zZXJ2ZXJEZWJ1Zy5kaWdlc3QgPT09ICdib29sZWFuJyAmJiAkd2luZG93LnNlcnZlckRlYnVnLmRpZ2VzdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGRldkxvZy5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIG5ld0xvZztcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBsb2dEZWNvcmF0b3I7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2RlY29yYXRvci9sb2cudHNcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG52YXIgRXhjZXB0aW9uSGFuZGxlciA9IGZ1bmN0aW9uICgkZGVsZWdhdGUsICR3aW5kb3cpIHtcbiAgICB2YXIgZXJyb3JIYW5kbGVyID0gZnVuY3Rpb24gKGVycm9yLCBjYXVzZSkge1xuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgICAgIHZhciBzdGFjayA9IGVyclsnc3RhY2snXTtcbiAgICAgICAgdmFyIGVycm9yRXZlbnQgPSBuZXcgJHdpbmRvdy5DdXN0b21FdmVudCgnU2VydmVyRXhjZXB0aW9uSGFuZGxlcicpO1xuICAgICAgICBlcnJvckV2ZW50LmRldGFpbHMgPSB7XG4gICAgICAgICAgICBleGNlcHRpb246IGVycm9yLFxuICAgICAgICAgICAgY2F1c2U6IGNhdXNlLFxuICAgICAgICAgICAgZXJyOiBzdGFja1xuICAgICAgICB9O1xuICAgICAgICAkd2luZG93LmRpc3BhdGNoRXZlbnQoZXJyb3JFdmVudCk7XG4gICAgICAgIHJldHVybiAkZGVsZWdhdGUoZXJyb3IsIGNhdXNlKTtcbiAgICB9O1xuICAgIHJldHVybiBlcnJvckhhbmRsZXI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRXhjZXB0aW9uSGFuZGxlcjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvZGVjb3JhdG9yL2V4Y2VwdGlvbkhhbmRsZXIudHNcbiAqKiBtb2R1bGUgaWQgPSAzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBFbmdpbmVRdWV1ZSA9IGZ1bmN0aW9uICgkbG9nLCAkcm9vdFNjb3BlLCAkd2luZG93KSB7XG4gICAgdmFyIGRvbmVWYXIgPSB7fTtcbiAgICB2YXIgc2V0U3RhdHVzID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIGlmIChpc0RvbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkb25lVmFyW25hbWVdID0gdmFsdWU7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgZG9uZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIGlzRG9uZSA9IGZhbHNlO1xuICAgIHZhciBhcmVEb25lVmFyQWxsVHJ1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRvbmVWYXIpIHtcbiAgICAgICAgICAgIGlmICghZG9uZVZhcltrZXldKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoZnJvbSkge1xuICAgICAgICAkbG9nLmRldignZW5naW5lUXVldWUuaXNEb25lKCknLCBmcm9tLCBkb25lVmFyKTtcbiAgICAgICAgaWYgKGlzRG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIGlzRG9uZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJlRG9uZVZhckFsbFRydWUoKSkge1xuICAgICAgICAgICAgaXNEb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBFdmVudF8xID0gJHdpbmRvd1snRXZlbnQnXTtcbiAgICAgICAgICAgIHZhciBkaXNwYXRjaEV2ZW50XzEgPSAkd2luZG93LmRpc3BhdGNoRXZlbnQ7XG4gICAgICAgICAgICB2YXIgSWRsZUV2ZW50ID0gbmV3IEV2ZW50XzEoJ0lkbGUnKTtcbiAgICAgICAgICAgIGRpc3BhdGNoRXZlbnRfMShJZGxlRXZlbnQpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdJbnRlcm5JZGxlJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzRG9uZTtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGlzRG9uZTogZG9uZSxcbiAgICAgICAgc2V0U3RhdHVzOiBzZXRTdGF0dXNcbiAgICB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEVuZ2luZVF1ZXVlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9mYWN0b3J5L2VuZ2luZVF1ZXVlLnRzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xudmFyIFEgPSBmdW5jdGlvbiAoJGRlbGVnYXRlLCBjb3VudGVyKSB7XG4gICAgdmFyIHFDb3VudGVyID0gY291bnRlci5jcmVhdGUoJ3EnKTtcbiAgICB2YXIgcHJvdG8gPSAkZGVsZWdhdGUucHJvdG90eXBlO1xuICAgIHZhciBPZGVmZXIgPSAkZGVsZWdhdGUuZGVmZXI7XG4gICAgdmFyIE9yZWplY3QgPSAkZGVsZWdhdGUucmVqZWN0O1xuICAgIHZhciBPcmFjZSA9ICRkZWxlZ2F0ZS5yYWNlO1xuICAgIHZhciBPYWxsID0gJGRlbGVnYXRlLmFsbDtcbiAgICB2YXIgT3Jlc29sdmUgPSAkZGVsZWdhdGUucmVzb2x2ZTtcbiAgICB2YXIgZGVmZXJGbiA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSBPZGVmZXIuYXBwbHkoY29udGV4dCwgW10pO1xuICAgICAgICAgICAgdmFyIG9yaWdpbmFsRGVmZXJSZXNvbHZlID0gZGVmZXJyZWQucmVzb2x2ZTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcUNvdW50ZXIuZGVjcigpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbERlZmVyUmVzb2x2ZS5hcHBseShkZWZlcnJlZCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgb3JpZ2luYWxEZWZlclJlamVjdCA9IGRlZmVycmVkLnJlamVjdDtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxQ291bnRlci5kZWNyKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsRGVmZXJSZWplY3QuYXBwbHkoZGVmZXJyZWQsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcUNvdW50ZXIuaW5jcigpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgdmFyICRRID0gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm9yc2x2ciAtIEV4cGVjdGVkIHJlc29sdmVyRm4sIGdvdCAtIHJlc29sdmVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXJGbih0aGlzKSgpO1xuICAgICAgICBmdW5jdGlvbiByZXNvbHZlRm4odmFsdWUpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdEZuKHJlYXNvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZXIocmVzb2x2ZUZuLCByZWplY3RGbik7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gICAgJFEucHJvdG90eXBlID0gcHJvdG87XG4gICAgJFEuZGVmZXIgPSBkZWZlckZuKCRkZWxlZ2F0ZSk7XG4gICAgJFEucmVqZWN0ID0gJGRlbGVnYXRlLnJlamVjdDtcbiAgICAkUS53aGVuID0gJGRlbGVnYXRlLndoZW47XG4gICAgJFEucmVzb2x2ZSA9IE9yZXNvbHZlO1xuICAgICRRLmFsbCA9IE9hbGw7XG4gICAgJFEucmFjZSA9IE9yYWNlO1xuICAgIHJldHVybiAkUTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBRO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9kZWNvcmF0b3IvcTIudHNcbiAqKiBtb2R1bGUgaWQgPSA1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBDb3VudGVyRmFjdG9yeSA9IGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkbG9nLCBlbmdpbmVRdWV1ZSwgdGltZW91dFZhbHVlKSB7XG4gICAgdmFyIGNvdW50ZXJzID0ge307XG4gICAgdmFyIGNyZWF0ZUNvdW50ZXIgPSBmdW5jdGlvbiAobmFtZSwgZG9uZUNCKSB7XG4gICAgICAgIGlmICghZG9uZUNCKSB7XG4gICAgICAgICAgICBkb25lQ0IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgJHJvb3RTY29wZS5jb3VudGVycyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuY291bnRlcnMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICAkcm9vdFNjb3BlLmNvdW50ZXJzW25hbWVdID0gMDtcbiAgICAgICAgJGxvZy5kZXYoJ2NvdW50ZXInLCAnY3JlYXRpbmcgY291bnRlcicsIG5hbWUpO1xuICAgICAgICBpZiAodHlwZW9mIGNvdW50ZXJzW25hbWVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIGNvdW50ZXJzW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50ZXJzW25hbWVdID0gbmV3IENvdW50ZXIobmFtZSwgZG9uZUNCLCAkcm9vdFNjb3BlLCBlbmdpbmVRdWV1ZSwgdGltZW91dFZhbHVlLmdldCgpLCAkbG9nKTtcbiAgICAgICAgcmV0dXJuIGNvdW50ZXJzW25hbWVdO1xuICAgIH07XG4gICAgdmFyIGluY3IgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmNvdW50ZXJzW25hbWVdKys7XG4gICAgICAgIGNvdW50ZXJzW25hbWVdLmluY3IoKTtcbiAgICB9O1xuICAgIHZhciBkZWNyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgJHJvb3RTY29wZS5jb3VudGVyc1tuYW1lXS0tO1xuICAgICAgICBjb3VudGVyc1tuYW1lXS5kZWNyKCk7XG4gICAgfTtcbiAgICB2YXIgZ2V0Q291bnQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gY291bnRlcnNbbmFtZV0uZ2V0Q291bnQoKTtcbiAgICB9O1xuICAgIHZhciB0b3VjaCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGNvdW50ZXJzW25hbWVdLnRvdWNoKCk7XG4gICAgfTtcbiAgICB2YXIgZ2V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGNvdW50ZXJzW25hbWVdO1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlOiBjcmVhdGVDb3VudGVyLFxuICAgICAgICBpbmNyOiBpbmNyLFxuICAgICAgICBkZWNyOiBkZWNyLFxuICAgICAgICBnZXRDb3VudDogZ2V0Q291bnQsXG4gICAgICAgIHRvdWNoOiB0b3VjaCxcbiAgICAgICAgZ2V0OiBnZXRcbiAgICB9O1xufTtcbnZhciBDb3VudGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb3VudGVyKG5hbWUsIGRvbmVDQiwgJHJvb3RTY29wZSwgZW5naW5lUXVldWUsIFRpbWVvdXRWYWx1ZSwgJGxvZykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvbmVDQiA9IGRvbmVDQjtcbiAgICAgICAgdGhpcy4kcm9vdFNjb3BlID0gJHJvb3RTY29wZTtcbiAgICAgICAgdGhpcy5lbmdpbmVRdWV1ZSA9IGVuZ2luZVF1ZXVlO1xuICAgICAgICB0aGlzLlRpbWVvdXRWYWx1ZSA9IFRpbWVvdXRWYWx1ZTtcbiAgICAgICAgdGhpcy4kbG9nID0gJGxvZztcbiAgICAgICAgdGhpcy51bnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpbWVyID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdGhpcy5nZXRDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5jb3VudDtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pc0RvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuZG9uZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jbGVhclRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLnRpbWVvdXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHdpbmRvdy5jbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICAgICAgX3RoaXMuJGxvZy5kZXYoX3RoaXMubmFtZSwgJ1RpbWVvdXQgY2xlYXJlZCcsIF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRvdWNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuJGxvZy5kZXYoJ0NvdW50ZXIgJyArIF90aGlzLm5hbWUsICdpcyBnZXR0aW5nIHRvdWNoZWQnKTtcbiAgICAgICAgICAgIGlmIChfdGhpcy51bnRvdWNoZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy4kbG9nLmRldignQ291bnRlciAnICsgX3RoaXMubmFtZSwgJ2hhcyBiZWVuIHRvdWNoZWQnLCBfdGhpcy51bnRvdWNoZWQsIF90aGlzLmdldENvdW50KCkpO1xuICAgICAgICAgICAgICAgIF90aGlzLmVuZ2luZVF1ZXVlLnNldFN0YXR1cyhfdGhpcy5uYW1lLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBfdGhpcy51bnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VySWRsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuJGxvZy5kZXYoJ0NvdW50ZXIgJyArIF90aGlzLm5hbWUsICd3b250IGdldCB0b3VjaGVkJywgX3RoaXMudW50b3VjaGVkLCBfdGhpcy5nZXRDb3VudCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pbmNyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMudW50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoX3RoaXMuZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmNvdW50Kys7XG4gICAgICAgICAgICBfdGhpcy4kbG9nLmRldihfdGhpcy5uYW1lLCAnSW5jcmVtZW50aW5nIGNvdW50ZXIgJywgX3RoaXMuY291bnQpO1xuICAgICAgICAgICAgX3RoaXMuZW5naW5lUXVldWUuc2V0U3RhdHVzKF90aGlzLm5hbWUsIGZhbHNlKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyVGltZW91dCgpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRlY3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMuZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmNvdW50LS07XG4gICAgICAgICAgICBfdGhpcy4kbG9nLmRldihfdGhpcy5uYW1lLCAnRGVjcmVtZW50aW5nIGNvdW50ZXIgJywgX3RoaXMuY291bnQpO1xuICAgICAgICAgICAgX3RoaXMuZW5naW5lUXVldWUuc2V0U3RhdHVzKF90aGlzLm5hbWUsIGZhbHNlKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyVGltZW91dCgpO1xuICAgICAgICAgICAgaWYgKF90aGlzLmNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMudHJpZ2dlcklkbGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy50cmlnZ2VySWRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyVGltZW91dCgpO1xuICAgICAgICAgICAgX3RoaXMuJGxvZy5kZXYoX3RoaXMubmFtZSwgJ3RyaWdnZXJJZGxlIGNhbGxlZCcsIF90aGlzLmNvdW50LCBfdGhpcy5UaW1lb3V0VmFsdWUpO1xuICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChfdGhpcy5jb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kbG9nLmRldihfdGhpcy5uYW1lLCAnc2V0dGluZyB0aGUgZG9uZVZhciB0byB0cnVlJywgX3RoaXMuY291bnQpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5lbmdpbmVRdWV1ZS5zZXRTdGF0dXMoX3RoaXMubmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5lbmdpbmVRdWV1ZS5pc0RvbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kbG9nLmRldihfdGhpcy5uYW1lLCAnY2FsbGluZyBDQigpJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kb25lQ0IoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGxvZy5kZXYoX3RoaXMubmFtZSwgJ3RyaWdnZXJJZGxlIGNhbmNlbGxlZCAnLCBfdGhpcy5jb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmVuZ2luZVF1ZXVlLnNldFN0YXR1cyhfdGhpcy5uYW1lLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgX3RoaXMuVGltZW91dFZhbHVlKTtcbiAgICAgICAgICAgIF90aGlzLiRsb2cuZGV2KF90aGlzLm5hbWUsICd0aW1lb3V0IHNldCB0bycsIF90aGlzLnRpbWVvdXQpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMuZW5naW5lUXVldWUuc2V0U3RhdHVzKHRoaXMubmFtZSwgZmFsc2UpO1xuICAgICAgICAkbG9nLmRldignY291bnRlcicsICdjb25zdHJ1Y3RvciBjYWxsZWQnLCB0aGlzLm5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gQ291bnRlcjtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBDb3VudGVyRmFjdG9yeTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvZmFjdG9yeS9Db3VudGVyLnRzXG4gKiogbW9kdWxlIGlkID0gNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgVGltZW91dFZhbHVlUHJvdmlkZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRpbWVvdXRWYWx1ZVByb3ZpZGVyKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnNldFRpbWVvdXRWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgX3RoaXMudGltZW91dFZhbHVlID0gdmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuJGdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2V0VGltZW91dFZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMudGltZW91dFZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudGltZW91dFZhbHVlID0gMjAwO1xuICAgIH1cbiAgICByZXR1cm4gVGltZW91dFZhbHVlUHJvdmlkZXI7XG59KCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gVGltZW91dFZhbHVlUHJvdmlkZXI7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3Byb3ZpZGVyL3RpbWVvdXRWYWx1ZS50c1xuICoqIG1vZHVsZSBpZCA9IDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcbnZhciBDYWNoZURhdGEgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENhY2hlRGF0YShuYW1lKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgX3RoaXMuZGF0YVtrZXldID0gRGF0ZS5ub3coKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIF90aGlzLmRhdGFba2V5XSAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGVsZXRlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaWYgKF90aGlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzLmRhdGFba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLmRhdGE7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5kYXRhID0ge307XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gQ2FjaGVEYXRhO1xufSgpKTtcbmV4cG9ydHMuQ2FjaGVGYWN0b3J5ID0gZnVuY3Rpb24gKCRkZWxlZ2F0ZSkge1xuICAgIHZhciBjYWNoZXMgPSB7fTtcbiAgICB2YXIgJGNhY2hlRmFjdG9yeSA9IGZ1bmN0aW9uIChjYWNoZUlkLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBjYWNoZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNhY2hlID0gJGRlbGVnYXRlKGNhY2hlSWQsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjYWNoZSA9ICRkZWxlZ2F0ZS5nZXQoY2FjaGVJZCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIE9wdXQgPSBjYWNoZS5wdXQ7XG4gICAgICAgIHZhciBPcmVtb3ZlID0gY2FjaGUucmVtb3ZlO1xuICAgICAgICBjYWNoZS5wdXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgY2FjaGVzW2NhY2hlSWRdLnNldChrZXkpO1xuICAgICAgICAgICAgT3B1dC5hcHBseShjYWNoZSwgW2tleSwgdmFsdWVdKTtcbiAgICAgICAgfTtcbiAgICAgICAgY2FjaGUucmVtb3ZlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgY2FjaGVzW2NhY2hlSWRdLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgT3JlbW92ZS5hcHBseShjYWNoZSwgW2tleV0pO1xuICAgICAgICB9O1xuICAgICAgICBjYWNoZXNbY2FjaGVJZF0gPSBuZXcgQ2FjaGVEYXRhKGNhY2hlSWQpO1xuICAgICAgICByZXR1cm4gY2FjaGU7XG4gICAgfTtcbiAgICAkY2FjaGVGYWN0b3J5LnByb3RvdHlwZSA9ICRkZWxlZ2F0ZS5wcm90b3R5cGU7XG4gICAgJGNhY2hlRmFjdG9yeS5leHBvcnQgPSBmdW5jdGlvbiAoY2FjaGVJZCkge1xuICAgICAgICBpZiAodHlwZW9mIGNhY2hlc1tjYWNoZUlkXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignJGNhY2hlRmFjdG9yeSAtIGlpZCAtIENhY2hlSWQgJyArIGNhY2hlSWQgKyAnIGlzIG5vdCBkZWZpbmVkIScpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIHZhciBjYWNoZSA9IGNhY2hlc1tjYWNoZUlkXTtcbiAgICAgICAgdmFyIHN0b3JlZENhY2hlID0gJGRlbGVnYXRlLmdldChjYWNoZUlkKTtcbiAgICAgICAgdmFyIGtleXMgPSBjYWNoZS5rZXlzKCk7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBrZXlzKSB7XG4gICAgICAgICAgICBkYXRhW2tleV0gPSBzdG9yZWRDYWNoZS5nZXQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9O1xuICAgICRjYWNoZUZhY3RvcnkuZXhwb3J0QWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBjYWNoZUlkIGluIGNhY2hlcykge1xuICAgICAgICAgICAgZGF0YVtjYWNoZUlkXSA9ICRjYWNoZUZhY3RvcnkuZXhwb3J0KGNhY2hlSWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG4gICAgJGNhY2hlRmFjdG9yeS5pbXBvcnQgPSBmdW5jdGlvbiAoY2FjaGVJZCwgZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIGNhY2hlc1tjYWNoZUlkXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICRjYWNoZUZhY3RvcnkoY2FjaGVJZCwge30pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdG9yZWRDYWNoZSA9ICRkZWxlZ2F0ZS5nZXQoY2FjaGVJZCk7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBzdG9yZWRDYWNoZS5wdXQoa2V5LCBkYXRhW2tleV0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAkY2FjaGVGYWN0b3J5LmltcG9ydEFsbCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAkY2FjaGVGYWN0b3J5LmltcG9ydChrZXksIGRhdGFba2V5XSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgICRjYWNoZUZhY3RvcnkuZGVsZXRlID0gZnVuY3Rpb24gKGNhY2hlSWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWNoZXNbY2FjaGVJZF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgc3RvcmVkQ2FjaGUgPSAkZGVsZWdhdGUuZ2V0KGNhY2hlSWQpO1xuICAgICAgICAgICAgc3RvcmVkQ2FjaGUucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICBzdG9yZWRDYWNoZS5kZXN0cm95KCk7XG4gICAgICAgICAgICBkZWxldGUgY2FjaGVzW2NhY2hlSWRdO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAkY2FjaGVGYWN0b3J5LmdldCA9ICRkZWxlZ2F0ZS5nZXQ7XG4gICAgJGNhY2hlRmFjdG9yeS5pbmZvID0gJGRlbGVnYXRlLmluZm87XG4gICAgcmV0dXJuICRjYWNoZUZhY3Rvcnk7XG59O1xuZXhwb3J0cy5UZW1wbGF0ZUNhY2hlID0gZnVuY3Rpb24gKCRjYWNoZUZhY3RvcnkpIHtcbiAgICByZXR1cm4gJGNhY2hlRmFjdG9yeSgndGVtcGxhdGVzJyk7XG59O1xudmFyIENhY2hlRmFjdG9yeUNvbmZpZyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2FjaGVGYWN0b3J5Q29uZmlnKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLiRnZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNldERlZmF1bHRDYWNoZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmRlZmF1bHRDYWNoZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ2V0RGVmYXVsdENhY2hlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5kZWZhdWx0Q2FjaGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kZWZhdWx0Q2FjaGUgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gQ2FjaGVGYWN0b3J5Q29uZmlnO1xufSgpKTtcbmV4cG9ydHMuQ2FjaGVGYWN0b3J5Q29uZmlnID0gQ2FjaGVGYWN0b3J5Q29uZmlnO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9kZWNvcmF0b3IvY2FjaGVGYWN0b3J5LnRzXG4gKiogbW9kdWxlIGlkID0gOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==