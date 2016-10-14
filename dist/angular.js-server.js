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
	var timeoutValue_1 = __webpack_require__(6);
	var cacheFactory_1 = __webpack_require__(7);
	var Socket_1 = __webpack_require__(8);
	var exceptionHandler_1 = __webpack_require__(9);
	var templateRequest_1 = __webpack_require__(10);
	angular.module('server', [])
	    .provider('timeoutValue', timeoutValue_1.default)
	    .decorator('$exceptionHandler', ['$delegate', '$log', '$window', exceptionHandler_1.default])
	    .factory('counter', ['$rootScope', '$log', 'engineQueue', 'timeoutValue', Counter_1.default])
	    .factory('engineQueue', ['$log', '$rootScope', '$window', '$cacheFactory', 'socket', engineQueue_1.default])
	    .factory('socket', [Socket_1.default])
	    .factory('httpInterceptorQueue', ['$q', '$log', 'engineQueue', 'counter', httpInterceptorQueue_1.default])
	    .decorator('$q', ['$delegate', 'counter', q2_1.default])
	    .decorator('$log', ['$delegate', 'socket', '$window', log_1.default])
	    .decorator('$cacheFactory', ['$delegate', cacheFactory_1.CacheFactory])
	    .decorator('$templateCache', ['$cacheFactory', cacheFactory_1.TemplateCache])
	    .decorator('$templateRequest', ['$delegate', templateRequest_1.default])
	    .provider('cacheFactoryConfig', cacheFactory_1.CacheFactoryConfig)
	    .config(function ($httpProvider) {
	    $httpProvider.interceptors.push('httpInterceptorQueue');
	})
	    .run(function ($rootScope, socket, $log, $exceptionHandler, $window, $timeout, $http, $cacheFactory, cacheFactoryConfig, timeoutValue, counter) {
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
	    if ($window.onServer == true) {
	        if (typeof $window['io'] !== 'undefined') {
	            socket.connect($window.serverConfig.socketHostname);
	        }
	        else {
	            var script = document.createElement('script');
	            $window.document.head.appendChild(script);
	            script.onload = function () {
	                console.log('IO SCRIPT LOADED', JSON.stringify($window.serverConfig.socketHostname + '/socket.io/socket.io.js'));
	                if (typeof $window['io'] === 'undefined') {
	                    throw new Error('It seems IO didnt load inside ngApp');
	                }
	                socket.connect($window.serverConfig.socketHostname);
	            };
	            script.src = $window.serverConfig.socketHostname + '/socket.io/socket.io.js';
	        }
	    }
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
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	var _this = this;
	var HttpInterceptorQueue = function ($q, $log, engineQueue, counter) {
	    $log.dev('HttpInterceptor', 'instanciated', _this);
	    var hCounter = counter.create('http');
	    var cacheMapping = {};
	    return {
	        request: function (config) {
	            $log.dev('httpRequest', config.url);
	            hCounter.incr();
	            if (window['onServer'] && typeof window['serverConfig']['cacheServer'] !== 'undefined') {
	                if (config.url.indexOf(window['serverConfig']['cacheServer']) === -1) {
	                    config.url = window['serverConfig']['cacheServer']
	                        + '/get?url='
	                        + encodeURIComponent(config.url)
	                        + '&original-url='
	                        + encodeURIComponent(window.location.href);
	                }
	            }
	            else {
	                if (config.url.indexOf('http://127.0.0.1:8883/get?url=') === -1) {
	                    config.url = 'http://127.0.0.1:8883/get?url='
	                        + encodeURIComponent(config.url)
	                        + '&original-url='
	                        + encodeURIComponent(window.location.href);
	                }
	            }
	            if (window['ngIdle'] === false) {
	                if (config.cache) {
	                    var cacheName = config.cache.info();
	                    cacheMapping[config.url] = cacheName.id;
	                }
	                else {
	                    cacheMapping[config.url] = '$http';
	                }
	            }
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
	var logDecorator = function ($delegate, socket, $window) {
	    if (typeof $window['onServer'] === 'undefined') {
	        $delegate.dev = function () { };
	        return $delegate;
	    }
	    var newLog = Object.create($delegate);
	    newLog.prototype = $delegate.prototype;
	    ['log', 'warn', 'info', 'error', 'debug'].forEach(function (item) {
	        newLog[item] = function () {
	            var args = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                args[_i - 0] = arguments[_i];
	            }
	            var log = {
	                type: item,
	                args: args
	            };
	            socket.emit('LOG', JSON.stringify(log));
	        };
	    });
	    newLog['dev'] = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        if ($window['serverDebug'] === true) {
	            var log = {
	                type: 'dev',
	                args: args
	            };
	            if ($window.serverDebug === true && args[0] !== 'digest') {
	                socket.emit('LOG', JSON.stringify(log));
	            }
	            else if (typeof $window.serverDebug.digest === 'boolean' && $window.serverDebug.digest === true) {
	                socket.emit('LOG', JSON.stringify(log));
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

	"use strict";
	var EngineQueue = function ($log, $rootScope, $window, $cacheFactory, socket) {
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
	                exportedCache[cacheId][cachedUrl] = cachedUrls[cachedUrl];
	            });
	        };
	        for (var cacheId in dependencies) {
	            _loop_1(cacheId);
	        }
	        console.log('cachedURLs = ', exportedCache);
	        return exportedCache;
	    };
	    var done = function (from) {
	        $log.dev('engineQueue.isDone()', from, doneVar);
	        if (isDone) {
	            return isDone;
	        }
	        if (areDoneVarAllTrue() && $rootScope.exception === false) {
	            isDone = true;
	            console.log($cacheFactory.exportAll());
	            console.log(dependencies);
	            $window['ngIdle'] = true;
	            console.log('exported cache', getExportedCache());
	            if ($window['onServer'] === true) {
	                socket.emit('IDLE', {
	                    html: document.documentElement.outerHTML,
	                    doctype: new XMLSerializer().serializeToString(document.doctype),
	                    url: window.location.href,
	                    uid: $window['serverConfig'].uid,
	                    exportedCache: getExportedCache()
	                });
	                socket.on('IDLE' + $window['serverConfig'].uid, function () {
	                    var Event = $window['Event'];
	                    var dispatchEvent = $window.dispatchEvent;
	                    var IdleEvent = new Event('Idle');
	                    dispatchEvent(IdleEvent);
	                    $rootScope.$broadcast('InternIdle');
	                });
	            }
	            else {
	                var Event_1 = $window['Event'];
	                var dispatchEvent_1 = $window.dispatchEvent;
	                var IdleEvent = new Event_1('Idle');
	                dispatchEvent_1(IdleEvent);
	                console.log('IDLE');
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
/* 5 */
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
/* 6 */
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
/* 7 */
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
	                console.log('Delegating caching to ', cacheId, options);
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


/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	var SocketFactory = function () {
	    var socket;
	    var queueEmit = [];
	    var queueOn = [];
	    var connected = false;
	    var connect = function (socketServer) {
	        console.log('connecting to socket server ', socketServer);
	        socket = window['io'].connect(socketServer + '?token=' + window['serverConfig'].uid);
	        socket.on('connect', function () {
	            console.log('connected');
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
	        if (!connected) {
	            queueEmit.push({ key: key, value: value });
	        }
	        else {
	            socket.emit(key, value);
	        }
	    };
	    var on = function (key, cb) {
	        console.log('Received Event ', key);
	        if (!connected) {
	            queueOn.push({ key: key, cb: cb });
	        }
	        else {
	            socket.on(key, cb);
	        }
	    };
	    return {
	        connect: connect,
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
	        $log.debug('Default exception handler.');
	        $delegate(exception, cause);
	    };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ExceptionHandler;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	var TemplateRequest = function ($delegate, $window) {
	    var $TemplateRequest = function (tpl, ignoreRequestError) {
	        console.log('Inside template request, querying ', tpl, ignoreRequestError);
	        if (typeof tpl === 'string') {
	            tpl = 'http://127.0.0.1:8883/get?url='
	                + encodeURIComponent(tpl)
	                + '&original-url='
	                + encodeURIComponent(window.location.href);
	        }
	        var result = $delegate(tpl, ignoreRequestError);
	        return result;
	    };
	    return $TemplateRequest;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = TemplateRequest;


/***/ }
/******/ ]);
//# sourceMappingURL=angular.js-server.js.map