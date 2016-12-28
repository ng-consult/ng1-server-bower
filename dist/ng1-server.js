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
	var engineQueue_1 = __webpack_require__(3);
	var q2_1 = __webpack_require__(4);
	var Counter_1 = __webpack_require__(5);
	var cacheFactory_1 = __webpack_require__(6);
	var serverConfig_1 = __webpack_require__(7);
	var Socket_1 = __webpack_require__(8);
	var exceptionHandler_1 = __webpack_require__(9);
	var templateRequest_1 = __webpack_require__(10);
	var windowError_1 = __webpack_require__(11);
	angular.module('server', [])
	    .factory('serverConfig', ['$window', serverConfig_1.default])
	    .factory('counter', ['$rootScope', '$log', 'engineQueue', 'serverConfig', Counter_1.default])
	    .factory('engineQueue', ['$log', '$rootScope', '$window', '$cacheFactory', 'socket', 'serverConfig', engineQueue_1.default])
	    .factory('socket', ['$window', 'serverConfig', Socket_1.default])
	    .factory('httpInterceptorQueue', ['$q', '$log', 'engineQueue', 'serverConfig', 'counter', httpInterceptorQueue_1.default])
	    .factory('windowError', ['$rootScope', '$window', 'serverConfig', windowError_1.default])
	    .decorator('$exceptionHandler', ['$delegate', '$log', '$window', exceptionHandler_1.default])
	    .decorator('$q', ['$delegate', 'counter', q2_1.default])
	    .decorator('$log', ['$delegate', 'socket', 'serverConfig', log_1.default])
	    .decorator('$cacheFactory', ['$delegate', cacheFactory_1.CacheFactory])
	    .decorator('$templateCache', ['$cacheFactory', cacheFactory_1.TemplateCache])
	    .decorator('$templateRequest', ['$delegate', '$sce', 'serverConfig', templateRequest_1.default])
	    .config(function ($httpProvider) {
	    $httpProvider.interceptors.push('httpInterceptorQueue');
	})
	    .run(function ($rootScope, socket, $log, $timeout, $http, $cacheFactory, windowError, serverConfig, counter) {
	    windowError.init();
	    serverConfig.init();
	    if (serverConfig.hasRestCache()) {
	        $cacheFactory.importAll(serverConfig.getRestCache());
	        $http.defaults.cache = true;
	    }
	    if (serverConfig.onServer() == true) {
	        $http.defaults.cache = true;
	        socket.init();
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
	    }, serverConfig.getTimeoutValue());
	    var digestWatcher = $rootScope.$watch(function () {
	        counter.incr('digest');
	        $rootScope.$$postDigest(function () {
	            counter.decr('digest');
	        });
	    });
	    if (serverConfig.hasRestCache() && serverConfig.getDefaultHttpCache() === false) {
	        $rootScope.$on('InternIdle', function () {
	            $http.defaults.cache = false;
	        });
	    }
	    ;
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	var _this = this;
	var HttpInterceptorQueue = function ($q, $log, engineQueue, serverConfig, counter) {
	    $log.dev('HttpInterceptor', 'instanciated', _this);
	    var hCounter = counter.create('http');
	    var cacheMapping = {};
	    return {
	        request: function (config) {
	            $log.dev('before decorator -> httpRequest', config.url);
	            hCounter.incr();
	            var restURL = serverConfig.getRestServer();
	            if (restURL !== null && config.url.indexOf(restURL) === -1) {
	                if (serverConfig.onServer() || serverConfig.getRestCacheEnabled()) {
	                    config.url = restURL
	                        + '/get?url='
	                        + encodeURIComponent(config.url);
	                }
	            }
	            if (serverConfig.onServer() && window['ngIdle'] === false) {
	                if (config.cache) {
	                    var cacheName = config.cache.info();
	                    cacheMapping[config.url] = cacheName.id;
	                }
	                else {
	                    cacheMapping[config.url] = '$http';
	                }
	            }
	            $log.dev('after decorator -> httpRequest', config.url);
	            $log.dev('cacheMapping = ', cacheMapping);
	            return $q.when(config);
	        },
	        requestError: function (rejection) {
	            hCounter.decr();
	            return $q.reject(rejection);
	        },
	        response: function (response) {
	            if (response.headers('ngservercached') === 'yes' && window['ngIdle'] === false) {
	                engineQueue.addDependency(response.config.url, cacheMapping[response.config.url]);
	            }
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
	var logDecorator = function ($delegate, socket, serverConfig) {
	    serverConfig.init();
	    var newLog = Object.create($delegate);
	    newLog.prototype = $delegate.prototype;
	    ['log', 'warn', 'info', 'error', 'debug'].forEach(function (item) {
	        if (serverConfig.onServer()) {
	            newLog[item] = function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                var log = {
	                    type: item,
	                    args: args
	                };
	                socket.emit('LOG', log);
	            };
	        }
	        else {
	            newLog[item] = $delegate[item];
	        }
	    });
	    if (serverConfig.getDebug() === true) {
	        var timer_1 = Date.now();
	        var devLog_1 = function () {
	            var args = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                args[_i - 0] = arguments[_i];
	            }
	            var time = Date.now() - timer_1;
	            timer_1 = Date.now();
	            var name = args.shift();
	            args.unshift(name + '+' + time + 'ms ');
	            return args;
	        };
	        newLog['dev'] = function () {
	            var args = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                args[_i - 0] = arguments[_i];
	            }
	            if (serverConfig.onServer()) {
	                newLog.dev = function () {
	                    var args = [];
	                    for (var _i = 0; _i < arguments.length; _i++) {
	                        args[_i - 0] = arguments[_i];
	                    }
	                    var log = {
	                        type: 'trace',
	                        args: devLog_1(args)
	                    };
	                    socket.emit('LOG', log);
	                };
	            }
	            else {
	                newLog.dev = function () {
	                    var args = [];
	                    for (var _i = 0; _i < arguments.length; _i++) {
	                        args[_i - 0] = arguments[_i];
	                    }
	                    return $delegate.debug.apply(null, devLog_1(args));
	                };
	            }
	        };
	    }
	    else {
	        newLog['dev'] = function () { };
	    }
	    return newLog;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = logDecorator;


/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	var EngineQueue = function ($log, $rootScope, $window, $cacheFactory, socket, serverConfig) {
	    var doneVar = {};
	    var dependencies = {};
	    var addDependency = function (url, cacheId) {
	        if (typeof dependencies[cacheId] === 'undefined') {
	            dependencies[cacheId] = [];
	        }
	        dependencies[cacheId].push(url);
	    };
	    $window['ngIdle'] = false;
	    $rootScope.exception = false;
	    $window.addEventListener('ExceptionHandler', function () {
	        $rootScope.exception = true;
	    });
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
	    var getExportedCache = function () {
	        var exportedCache = {};
	        var _loop_1 = function(cacheId) {
	            exportedCache[cacheId] = {};
	            var cachedUrls = $cacheFactory.export(cacheId);
	            dependencies[cacheId].forEach(function (cachedUrl) {
	                if (serverConfig.getRestCacheEnabled()) {
	                    exportedCache[cacheId][cachedUrl] = cachedUrls[cachedUrl];
	                }
	                else {
	                    var cacheServerURL = serverConfig.getRestServer() + '/get?url=';
	                    if (cachedUrl.indexOf(cacheServerURL) === 0) {
	                        var decodedCachedUrl = decodeURIComponent(cachedUrl.replace(cacheServerURL, ''));
	                        exportedCache[cacheId][decodedCachedUrl] = cachedUrls[cachedUrl];
	                    }
	                    else {
	                        throw new Error('Something unlogical hapens here');
	                    }
	                }
	            });
	        };
	        for (var cacheId in dependencies) {
	            _loop_1(cacheId);
	        }
	        return exportedCache;
	    };
	    var done = function (from) {
	        $log.dev('engineQueue.isDone()', from, doneVar);
	        if (isDone) {
	            return isDone;
	        }
	        if (areDoneVarAllTrue() && $rootScope.exception === false) {
	            isDone = true;
	            $window['ngIdle'] = true;
	            if (serverConfig.onServer() === true) {
	                var doctype = void 0;
	                try {
	                    doctype = new XMLSerializer().serializeToString(document.doctype);
	                }
	                catch (e) {
	                    $log.warn('There is no doctype associated to this document');
	                    doctype = '';
	                }
	                socket.emit('IDLE', {
	                    html: document.documentElement.outerHTML,
	                    doctype: doctype,
	                    url: window.location.href,
	                    exportedCache: getExportedCache()
	                });
	                socket.on('IDLE' + serverConfig.getUID(), function () {
	                    var Event = $window['Event'];
	                    var dispatchEvent = $window.dispatchEvent;
	                    var IdleEvent = new Event('Idle');
	                    dispatchEvent(IdleEvent);
	                    $rootScope.$broadcast('InternIdle');
	                });
	            }
	            else {
	                if (serverConfig.hasRestCache() && serverConfig.getDefaultHttpCache() === false) {
	                    $cacheFactory.delete('$http');
	                }
	                var Event_1 = $window['Event'];
	                var dispatchEvent_1 = $window.dispatchEvent;
	                var IdleEvent = new Event_1('Idle');
	                dispatchEvent_1(IdleEvent);
	                $rootScope.$broadcast('InternIdle');
	            }
	        }
	        return isDone;
	    };
	    return {
	        isDone: done,
	        setStatus: setStatus,
	        addDependency: addDependency
	    };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = EngineQueue;


/***/ },
/* 4 */
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
	    function get$Q() {
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
	    }
	    return get$Q();
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Q;


/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	var CounterFactory = function ($rootScope, $log, engineQueue, serverConfig) {
	    serverConfig.init();
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
	        counters[name] = new Counter(name, doneCB, $rootScope, engineQueue, serverConfig.getTimeoutValue(), $log);
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
	        this.done = false;
	        this.count = 0;
	        this.engineQueue.setStatus(this.name, false);
	        $log.dev('counter', 'constructor called', this.name);
	    }
	    Counter.prototype.triggerIdle = function () {
	        var _this = this;
	        this.clearTimeout();
	        this.$log.dev(this.name, 'triggerIdle called', this.count, this.TimeoutValue);
	        this.timeout = setTimeout(function () {
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
	        }, this.TimeoutValue);
	        this.$log.dev(this.name, 'timeout set to', this.timeout);
	    };
	    ;
	    return Counter;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = CounterFactory;


/***/ },
/* 6 */
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
	    function getCacheFactory() {
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
	    }
	    return getCacheFactory();
	};
	exports.TemplateCache = function ($cacheFactory) {
	    return $cacheFactory('templates');
	};


/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	var ServerConfigFactory = function ($window) {
	    var initialized = false;
	    var httpCache = true;
	    var restServer = null;
	    var restCacheEnabled = false;
	    var timeoutValue = 200;
	    var server = false;
	    var uid = null;
	    var socketServer = null;
	    var restCache = null;
	    var debug = false;
	    var init = function () {
	        if (initialized)
	            return;
	        initialized = true;
	        if (angular.isDefined($window['onServer']) && $window['onServer'] === true) {
	            server = true;
	        }
	        if (angular.isDefined($window['serverConfig'])) {
	            if (angular.isDefined($window['serverConfig'].clientTimeoutValue)) {
	                timeoutValue = $window['serverConfig'].clientTimeoutValue;
	            }
	            if (angular.isDefined($window['serverConfig'].restServerURL)) {
	                restServer = $window['serverConfig'].restServerURL;
	            }
	            if (angular.isDefined($window['serverConfig'].uid)) {
	                uid = $window['serverConfig'].uid;
	            }
	            if (angular.isDefined($window['serverConfig'].socketServerURL)) {
	                socketServer = $window['serverConfig'].socketServerURL;
	            }
	            if (angular.isDefined($window['ngServerCache'])) {
	                restCache = $window['ngServerCache'];
	            }
	            if (angular.isDefined($window['serverConfig'].debug)) {
	                debug = $window['serverConfig'].debug;
	            }
	            if (angular.isDefined($window['serverConfig'].httpCache)) {
	                httpCache = $window['serverConfig'].httpCache;
	            }
	            if (angular.isDefined($window['serverConfig'].restCacheEnabled)) {
	                restCacheEnabled = $window['serverConfig'].restCacheEnabled;
	            }
	        }
	        if (server && (socketServer === null || uid === null)) {
	            console.error($window['serverConfig']);
	            throw new Error('invalid serverConfig: uid, socketServer missing ');
	        }
	    };
	    var hasRestCache = function () {
	        return restCache !== null;
	    };
	    var onServer = function () {
	        return server;
	    };
	    var getDebug = function () {
	        return debug;
	    };
	    var getDefaultHttpCache = function () {
	        return httpCache;
	    };
	    var getRestCacheEnabled = function () {
	        return restCacheEnabled;
	    };
	    var getRestServer = function () {
	        return restServer;
	    };
	    var getSocketServer = function () {
	        return socketServer;
	    };
	    var getTimeoutValue = function () {
	        return timeoutValue;
	    };
	    var getUID = function () {
	        return uid;
	    };
	    var getRestCache = function () {
	        return restCache;
	    };
	    var setDefaultHtpCache = function (value) {
	        httpCache = value;
	    };
	    var setRestServer = function (value) {
	        restServer = value;
	    };
	    var setTimeoutValue = function (value) {
	        timeoutValue = value;
	    };
	    return {
	        init: init,
	        hasRestCache: hasRestCache,
	        onServer: onServer,
	        getDebug: getDebug,
	        getDefaultHttpCache: getDefaultHttpCache,
	        getRestCache: getRestCache,
	        getRestCacheEnabled: getRestCacheEnabled,
	        getRestServer: getRestServer,
	        getSocketServer: getSocketServer,
	        getTimeoutValue: getTimeoutValue,
	        getUID: getUID,
	        setDefaultHtpCache: setDefaultHtpCache,
	        setRestServer: setRestServer,
	        setTimeoutValue: setTimeoutValue
	    };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ServerConfigFactory;


/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	var SocketFactory = function ($window, serverConfig) {
	    serverConfig.init();
	    var socket;
	    var queueEmit = [];
	    var queueOn = [];
	    var connected = false;
	    var init = function () {
	        if (typeof $window['io'] !== 'undefined') {
	            connect();
	        }
	        else {
	            var script = $window.document.createElement('script');
	            $window.document.head.appendChild(script);
	            script.onload = function () {
	                if (typeof $window['io'] === 'undefined') {
	                    throw new Error('It seems IO didnt load inside ngApp');
	                }
	                connect();
	            };
	            script.src = serverConfig.getSocketServer() + '/socket.io/socket.io.js';
	        }
	    };
	    var connect = function () {
	        socket = window['io'].connect(serverConfig.getSocketServer() + '?token=' + serverConfig.getUID());
	        socket.on('connect', function () {
	            connected = true;
	            var elem;
	            while (elem = queueEmit.shift()) {
	                emit(elem.key, elem.value);
	            }
	            while (elem = queueOn.shift()) {
	                on(elem.key, elem.cb);
	            }
	        });
	        socket.on('connect_timeout', function (err) {
	            console.log('connect_timeout', err);
	        });
	        socket.on('connect_error', function (err) {
	            console.log('connect_error', err);
	        });
	    };
	    var emit = function (key, value) {
	        value = Object.assign({}, { uid: serverConfig.getUID() }, value);
	        if (!connected) {
	            queueEmit.push({ key: key, value: value });
	        }
	        else {
	            socket.emit(key, value);
	        }
	    };
	    var on = function (key, cb) {
	        if (!connected) {
	            queueOn.push({ key: key, cb: cb });
	        }
	        else {
	            socket.on(key, cb);
	        }
	    };
	    return {
	        init: init,
	        emit: emit,
	        on: on
	    };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = SocketFactory;


/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';
	var ExceptionHandler = function ($delegate, $log, $window) {
	    var Event = $window['Event'];
	    var dispatchEvent = $window.dispatchEvent;
	    var IdleEvent = new Event('ExceptionHandler');
	    return function (exception, cause) {
	        dispatchEvent(IdleEvent);
	        $delegate(exception, cause);
	    };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ExceptionHandler;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	var TemplateRequest = function ($delegate, $sce, serverConfig) {
	    var $TemplateRequest = function (tpl, ignoreRequestError) {
	        var restURL = serverConfig.getRestServer();
	        if (restURL !== null) {
	            if (typeof tpl === 'string') {
	                tpl = $sce.trustAsResourceUrl(restURL + '/get?url=' + encodeURIComponent(tpl));
	            }
	        }
	        var result = $delegate(tpl, ignoreRequestError);
	        return result;
	    };
	    return $TemplateRequest;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = TemplateRequest;


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	var WindowError = function ($rootScope, $window, serverConfig) {
	    var init = function () {
	        if (serverConfig.onServer() === false)
	            return;
	        var originalThrow = $window.throw;
	        var originalErrorHandler = $window.onerror;
	        if (!originalErrorHandler) {
	            originalErrorHandler = function mockHandler() {
	                return (true);
	            };
	        }
	        $window.onerror = function handleGlobalError(message, fileName, lineNumber, columnNumber, error) {
	            if (!error) {
	                error = new Error(message);
	                error.fileName = fileName;
	                error.lineNumber = lineNumber;
	                error.columnNumber = (columnNumber || 0);
	            }
	            $rootScope.exception = true;
	            return false;
	        };
	    };
	    return {
	        init: init
	    };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = WindowError;


/***/ }
/******/ ]);
//# sourceMappingURL=ng1-server.js.map