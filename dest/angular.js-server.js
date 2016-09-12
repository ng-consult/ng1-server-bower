/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Created by antoine on 11/09/16.
	 */
	"use strict";
	var engineQueue_1 = __webpack_require__(1);
	var q_1 = __webpack_require__(2);
	angular.module('server', [])
	    .provider('$engineQueue', engineQueue_1.default)
	    .provider('$q', q_1.default)
	    .config(function ($provide) {
	    if (typeof window.onServer !== 'undefined' && window.onServer === true) {
	        $provide.decorator('$exceptionHandler', function ($delegate, $log, $window) {
	            var errorHandler = function (error, cause) {
	                var err = new Error();
	                var stack = err.stack;
	                var errorEvent = new $window.CustomEvent('ServerExceptionHandler');
	                errorEvent.details = {
	                    exception: error,
	                    cause: cause,
	                    err: err.stack
	                };
	                $window.dispatchEvent(errorEvent);
	                $delegate(error, cause);
	            };
	            return errorHandler;
	        });
	        if (typeof window.fs !== 'undefined' && typeof window.logConfig !== 'undefined') {
	            var fs_1 = window.fs;
	            var config_1 = window.logConfig;
	            $provide.decorator('$log', [
	                '$delegate',
	                function logDecorator($delegate) {
	                    var myLog = {
	                        warn: function (msg) {
	                            log(msg, 'warn');
	                        },
	                        error: function (msg) {
	                            log(msg, 'error');
	                        },
	                        info: function (msg) {
	                            log(msg, 'info');
	                        },
	                        debug: function (msg) {
	                            log(msg, 'debug');
	                        },
	                        log: function (msg) {
	                            log(msg, 'log');
	                        }
	                    };
	                    var log = function (msg, type) {
	                        var date = new Date();
	                        var logMsg = date + " -> " + msg + '\n';
	                        if (config_1[type]['stack'] === true) {
	                            var err = new Error();
	                            var stack = err.stack;
	                            logMsg += stack + '\n\n';
	                        }
	                        fs_1.appendFile(config_1[type]['path'], logMsg, function (err) {
	                            if (err)
	                                throw err;
	                        });
	                    };
	                    return myLog;
	                }
	            ]);
	        }
	    }
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	/**
	 * Created by antoine on 11/09/16.
	 */
	"use strict";
	function EngineQueue() {
	    var self = this;
	    var setTimeout = window.setTimeout;
	    var clearTimeout = window.clearTimeout;
	    var Event = window.Event;
	    var dispatchEvent = window.dispatchEvent;
	    /**
	     *
	     * @type {number} number of running promises
	     */
	    var promises = 0;
	    /**
	     *
	     * @type {boolean}
	     */
	    var done = false;
	    /**
	     *
	     * @type {number} idle bufer time in ms
	     */
	    var timeoutValue = 500;
	    /**
	     *
	     * @type {TimeOut} the timeout that runs only when all the queues are empty with the idle check timeoutValue
	     */
	    var timeout = null;
	    /**
	     *
	     * @param object Add an object:
	     * @param type string httpBackend|promise|timeout
	     */
	    self.incr = function () {
	        if (timeout !== null) {
	            clearTimeout(timeout);
	        }
	        if (done === true)
	            return;
	        promises++;
	    };
	    /**
	     *
	     * @param object
	     * @param string httpBackend|promise|timeout
	     */
	    self.decr = function () {
	        if (done === true)
	            return;
	        promises--;
	        if (timeout !== null) {
	            clearTimeout(timeout);
	        }
	        if (promises === 0) {
	            timeout = setTimeout(function () {
	                if (promises === 0) {
	                    var StackQueueEmpty = new Event('StackQueueEmpty');
	                    if (typeof dispatchEvent === 'function') {
	                        dispatchEvent(StackQueueEmpty);
	                    }
	                    done = true;
	                }
	            }, timeoutValue, false);
	        }
	    };
	}
	/**
	 * @ngdoc service
	 * @name $engineQueue
	 * @requires
	 *
	 * @description
	 * A Queue that stores the running status of the Angular APplication
	 * An Empty queue means the application is in 'idle'.
	 * It is used internally
	 *
	 */
	function $EngineQueueProvider() {
	    this.$get = [function () {
	            return new EngineQueue();
	        }];
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = $EngineQueueProvider;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Angular_1 = __webpack_require__(3);
	'use strict';
	/**
	 * @ngdoc service
	 * @name $q
	 * @requires $rootScope
	 *
	 * @description
	 * A service that helps you run functions asynchronously, and use their return values (or exceptions)
	 * when they are done processing.
	 *
	 * This is an implementation of promises/deferred objects inspired by
	 * [Kris Kowal's Q](https://github.com/kriskowal/q).
	 *
	 * $q can be used in two fashions --- one which is more similar to Kris Kowal's Q or jQuery's Deferred
	 * implementations, and the other which resembles ES6 (ES2015) promises to some degree.
	 *
	 * # $q constructor
	 *
	 * The streamlined ES6 style promise is essentially just using $q as a constructor which takes a `resolver`
	 * function as the first argument. This is similar to the native Promise implementation from ES6,
	 * see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
	 *
	 * While the constructor-style use is supported, not all of the supporting methods from ES6 promises are
	 * available yet.
	 *
	 * It can be used like so:
	 *
	 * ```js
	 *   // for the purpose of this example let's assume that variables `$q` and `okToGreet`
	 *   // are available in the current lexical scope (they could have been injected or passed in).
	 *
	 *   function asyncGreet(name) {
	 *     // perform some asynchronous operation, resolve or reject the promise when appropriate.
	 *     return $q(function(resolve, reject) {
	 *       setTimeout(function() {
	 *         if (okToGreet(name)) {
	 *           resolve('Hello, ' + name + '!');
	 *         } else {
	 *           reject('Greeting ' + name + ' is not allowed.');
	 *         }
	 *       }, 1000);
	 *     });
	 *   }
	 *
	 *   var promise = asyncGreet('Robin Hood');
	 *   promise.then(function(greeting) {
	 *     alert('Success: ' + greeting);
	 *   }, function(reason) {
	 *     alert('Failed: ' + reason);
	 *   });
	 * ```
	 *
	 * Note: progress/notify callbacks are not currently supported via the ES6-style interface.
	 *
	 * Note: unlike ES6 behavior, an exception thrown in the constructor function will NOT implicitly reject the promise.
	 *
	 * However, the more traditional CommonJS-style usage is still available, and documented below.
	 *
	 * [The CommonJS Promise proposal](http://wiki.commonjs.org/wiki/Promises) describes a promise as an
	 * interface for interacting with an object that represents the result of an action that is
	 * performed asynchronously, and may or may not be finished at any given point in time.
	 *
	 * From the perspective of dealing with error handling, deferred and promise APIs are to
	 * asynchronous programming what `try`, `catch` and `throw` keywords are to synchronous programming.
	 *
	 * ```js
	 *   // for the purpose of this example let's assume that variables `$q` and `okToGreet`
	 *   // are available in the current lexical scope (they could have been injected or passed in).
	 *
	 *   function asyncGreet(name) {
	 *     var deferred = $q.defer();
	 *
	 *     setTimeout(function() {
	 *       deferred.notify('About to greet ' + name + '.');
	 *
	 *       if (okToGreet(name)) {
	 *         deferred.resolve('Hello, ' + name + '!');
	 *       } else {
	 *         deferred.reject('Greeting ' + name + ' is not allowed.');
	 *       }
	 *     }, 1000);
	 *
	 *     return deferred.promise;
	 *   }
	 *
	 *   var promise = asyncGreet('Robin Hood');
	 *   promise.then(function(greeting) {
	 *     alert('Success: ' + greeting);
	 *   }, function(reason) {
	 *     alert('Failed: ' + reason);
	 *   }, function(update) {
	 *     alert('Got notification: ' + update);
	 *   });
	 * ```
	 *
	 * At first it might not be obvious why this extra complexity is worth the trouble. The payoff
	 * comes in the way of guarantees that promise and deferred APIs make, see
	 * https://github.com/kriskowal/uncommonjs/blob/master/promises/specification.md.
	 *
	 * Additionally the promise api allows for composition that is very hard to do with the
	 * traditional callback ([CPS](http://en.wikipedia.org/wiki/Continuation-passing_style)) approach.
	 * For more on this please see the [Q documentation](https://github.com/kriskowal/q) especially the
	 * section on serial or parallel joining of promises.
	 *
	 * # The Deferred API
	 *
	 * A new instance of deferred is constructed by calling `$q.defer()`.
	 *
	 * The purpose of the deferred object is to expose the associated Promise instance as well as APIs
	 * that can be used for signaling the successful or unsuccessful completion, as well as the status
	 * of the task.
	 *
	 * **Methods**
	 *
	 * - `resolve(value)` – resolves the derived promise with the `value`. If the value is a rejection
	 *   constructed via `$q.reject`, the promise will be rejected instead.
	 * - `reject(reason)` – rejects the derived promise with the `reason`. This is equivalent to
	 *   resolving it with a rejection constructed via `$q.reject`.
	 * - `notify(value)` - provides updates on the status of the promise's execution. This may be called
	 *   multiple times before the promise is either resolved or rejected.
	 *
	 * **Properties**
	 *
	 * - promise – `{Promise}` – promise object associated with this deferred.
	 *
	 *
	 * # The Promise API
	 *
	 * A new promise instance is created when a deferred instance is created and can be retrieved by
	 * calling `deferred.promise`.
	 *
	 * The purpose of the promise object is to allow for interested parties to get access to the result
	 * of the deferred task when it completes.
	 *
	 * **Methods**
	 *
	 * - `then(successCallback, [errorCallback], [notifyCallback])` – regardless of when the promise was or
	 *   will be resolved or rejected, `then` calls one of the success or error callbacks asynchronously
	 *   as soon as the result is available. The callbacks are called with a single argument: the result
	 *   or rejection reason. Additionally, the notify callback may be called zero or more times to
	 *   provide a progress indication, before the promise is resolved or rejected.
	 *
	 *   This method *returns a new promise* which is resolved or rejected via the return value of the
	 *   `successCallback`, `errorCallback` (unless that value is a promise, in which case it is resolved
	 *   with the value which is resolved in that promise using
	 *   [promise chaining](http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promises-queues)).
	 *   It also notifies via the return value of the `notifyCallback` method. The promise cannot be
	 *   resolved or rejected from the notifyCallback method. The errorCallback and notifyCallback
	 *   arguments are optional.
	 *
	 * - `catch(errorCallback)` – shorthand for `promise.then(null, errorCallback)`
	 *
	 * - `finally(callback, notifyCallback)` – allows you to observe either the fulfillment or rejection of a promise,
	 *   but to do so without modifying the final value. This is useful to release resources or do some
	 *   clean-up that needs to be done whether the promise was rejected or resolved. See the [full
	 *   specification](https://github.com/kriskowal/q/wiki/API-Reference#promisefinallycallback) for
	 *   more information.
	 *
	 * # Chaining promises
	 *
	 * Because calling the `then` method of a promise returns a new derived promise, it is easily
	 * possible to create a chain of promises:
	 *
	 * ```js
	 *   promiseB = promiseA.then(function(result) {
	 *     return result + 1;
	 *   });
	 *
	 *   // promiseB will be resolved immediately after promiseA is resolved and its value
	 *   // will be the result of promiseA incremented by 1
	 * ```
	 *
	 * It is possible to create chains of any length and since a promise can be resolved with another
	 * promise (which will defer its resolution further), it is possible to pause/defer resolution of
	 * the promises at any point in the chain. This makes it possible to implement powerful APIs like
	 * $http's response interceptors.
	 *
	 *
	 * # Differences between Kris Kowal's Q and $q
	 *
	 *  There are two main differences:
	 *
	 * - $q is integrated with the {@link ng.$rootScope.Scope} Scope model observation
	 *   mechanism in angular, which means faster propagation of resolution or rejection into your
	 *   models and avoiding unnecessary browser repaints, which would result in flickering UI.
	 * - Q has many more features than $q, but that comes at a cost of bytes. $q is tiny, but contains
	 *   all the important functionality needed for common async tasks.
	 *
	 * # Testing
	 *
	 *  ```js
	 *    it('should simulate promise', inject(function($q, $rootScope) {
	 *      var deferred = $q.defer();
	 *      var promise = deferred.promise;
	 *      var resolvedValue;
	 *
	 *      promise.then(function(value) { resolvedValue = value; });
	 *      expect(resolvedValue).toBeUndefined();
	 *
	 *      // Simulate resolving of promise
	 *      deferred.resolve(123);
	 *      // Note that the 'then' function does not get called synchronously.
	 *      // This is because we want the promise API to always be async, whether or not
	 *      // it got called synchronously or asynchronously.
	 *      expect(resolvedValue).toBeUndefined();
	 *
	 *      // Propagate promise resolution to 'then' functions using $apply().
	 *      $rootScope.$apply();
	 *      expect(resolvedValue).toEqual(123);
	 *    }));
	 *  ```
	 *
	 * @param {function(function, function)} resolver Function which is responsible for resolving or
	 *   rejecting the newly created promise. The first parameter is a function which resolves the
	 *   promise, the second parameter is a function which rejects the promise.
	 *
	 * @returns {Promise} The newly created promise.
	 */
	/**
	 * @ngdoc provider
	 * @name $qProvider
	 *
	 * @description
	 */
	function $QProvider() {
	    var errorOnUnhandledRejections = true;
	    this.$get = ['$rootScope', '$exceptionHandler', '$engineQueue', function ($rootScope, $exceptionHandler, $engineQueue) {
	            return qFactory(function (callback) {
	                $rootScope.$evalAsync(callback);
	            }, $exceptionHandler, $engineQueue, errorOnUnhandledRejections);
	        }];
	    /**
	     * @ngdoc method
	     * @name $qProvider#errorOnUnhandledRejections
	     * @kind function
	     *
	     * @description
	     * Retrieves or overrides whether to generate an error when a rejected promise is not handled.
	     *
	     * @param {boolean=} value Whether to generate an error when a rejected promise is not handled.
	     * @returns {boolean|ng.$qProvider} Current value when called without a new value or self for
	     *    chaining otherwise.
	     */
	    this.errorOnUnhandledRejections = function (value) {
	        if (Angular_1.isDefined(value)) {
	            errorOnUnhandledRejections = value;
	            return this;
	        }
	        else {
	            return errorOnUnhandledRejections;
	        }
	    };
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = $QProvider;
	function $$QProvider() {
	    var errorOnUnhandledRejections = true;
	    this.$get = ['$browser', '$exceptionHandler', '$engineQueue', function ($browser, $exceptionHandler, $engineQueue) {
	            return qFactory(function (callback) {
	                $browser.defer(callback);
	            }, $exceptionHandler, $engineQueue, errorOnUnhandledRejections);
	        }];
	    this.errorOnUnhandledRejections = function (value) {
	        if (Angular_1.isDefined(value)) {
	            errorOnUnhandledRejections = value;
	            return this;
	        }
	        else {
	            return errorOnUnhandledRejections;
	        }
	    };
	}
	exports.$$QProvider = $$QProvider;
	/**
	 * Constructs a promise manager.
	 *
	 * @param {function(function)} nextTick Function for executing functions in the next turn.
	 * @param {function(...*)} exceptionHandler Function into which unexpected exceptions are passed for
	 *     debugging purposes.
	 @ param {=boolean} errorOnUnhandledRejections Whether an error should be generated on unhandled
	 *     promises rejections.
	 * @returns {object} Promise manager.
	 */
	function qFactory(nextTick, exceptionHandler, engineQueue, errorOnUnhandledRejections) {
	    var $qMinErr = Angular_1.minErr('$q', TypeError);
	    var queueSize = 0;
	    var checkQueue = [];
	    /**
	     * @ngdoc method
	     * @name ng.$q#defer
	     * @kind function
	     *
	     * @description
	     * Creates a `Deferred` object which represents a task which will finish in the future.
	     *
	     * @returns {Deferred} Returns a new instance of deferred.
	     */
	    var defer = function () {
	        var d = new Deferred();
	        //Necessary to support unbound execution :/
	        d.resolve = simpleBind(d, d.resolve);
	        d.reject = simpleBind(d, d.reject);
	        d.notify = simpleBind(d, d.notify);
	        return d;
	    };
	    function Promise() {
	        this.$$state = { status: 0 };
	    }
	    Angular_1.extend(Promise.prototype, {
	        then: function (onFulfilled, onRejected, progressBack) {
	            if (Angular_1.isUndefined(onFulfilled) && Angular_1.isUndefined(onRejected) && Angular_1.isUndefined(progressBack)) {
	                return this;
	            }
	            var result = new Deferred();
	            this.$$state.pending = this.$$state.pending || [];
	            this.$$state.pending.push([result, onFulfilled, onRejected, progressBack]);
	            if (this.$$state.status > 0)
	                scheduleProcessQueue(this.$$state);
	            return result.promise;
	        },
	        "catch": function (callback) {
	            return this.then(null, callback);
	        },
	        "finally": function (callback, progressBack) {
	            return this.then(function (value) {
	                return handleCallback(value, true, callback);
	            }, function (error) {
	                return handleCallback(error, false, callback);
	            }, progressBack);
	        }
	    });
	    //Faster, more basic than angular.bind http://jsperf.com/angular-bind-vs-custom-vs-native
	    function simpleBind(context, fn) {
	        return function (value) {
	            fn.call(context, value);
	        };
	    }
	    function processQueue(state) {
	        var fn, deferred, pending;
	        pending = state.pending;
	        state.processScheduled = false;
	        state.pending = undefined;
	        try {
	            for (var i = 0, ii = pending.length; i < ii; ++i) {
	                state.pur = true;
	                deferred = pending[i][0];
	                fn = pending[i][state.status];
	                try {
	                    if (Angular_1.isFunction(fn)) {
	                        deferred.resolve(fn(state.value));
	                    }
	                    else if (state.status === 1) {
	                        deferred.resolve(state.value);
	                    }
	                    else {
	                        deferred.reject(state.value);
	                    }
	                }
	                catch (e) {
	                    deferred.reject(e);
	                    exceptionHandler(e);
	                }
	            }
	        }
	        finally {
	            --queueSize;
	            if (errorOnUnhandledRejections && queueSize === 0) {
	                nextTick(processChecksFn());
	            }
	        }
	    }
	    function processChecks() {
	        while (!queueSize && checkQueue.length) {
	            var toCheck = checkQueue.shift();
	            if (!toCheck.pur) {
	                toCheck.pur = true;
	                var errorMessage = 'Possibly unhandled rejection: ' + Angular_1.toDebugString(toCheck.value);
	                exceptionHandler(errorMessage);
	            }
	        }
	    }
	    function processChecksFn() {
	        return function () { processChecks(); };
	    }
	    function processQueueFn(state) {
	        return function () { processQueue(state); };
	    }
	    function scheduleProcessQueue(state) {
	        if (errorOnUnhandledRejections && !state.pending && state.status === 2 && !state.pur) {
	            if (queueSize === 0 && checkQueue.length === 0) {
	                nextTick(processChecksFn());
	            }
	            checkQueue.push(state);
	        }
	        if (state.processScheduled || !state.pending)
	            return;
	        state.processScheduled = true;
	        ++queueSize;
	        nextTick(processQueueFn(state));
	    }
	    function Deferred() {
	        this.promise = new Promise();
	        engineQueue.incr();
	    }
	    Angular_1.extend(Deferred.prototype, {
	        resolve: function (val) {
	            if (this.promise.$$state.status)
	                return;
	            if (val === this.promise) {
	                this.$$reject($qMinErr('qcycle', "Expected promise to be resolved with value other than itself '{0}'", val));
	            }
	            else {
	                engineQueue.decr();
	                this.$$resolve(val);
	            }
	        },
	        $$resolve: function (val) {
	            var then;
	            var that = this;
	            var done = false;
	            try {
	                if ((Angular_1.isObject(val) || Angular_1.isFunction(val)))
	                    then = val && val.then;
	                if (Angular_1.isFunction(then)) {
	                    this.promise.$$state.status = -1;
	                    then.call(val, resolvePromise, rejectPromise, simpleBind(this, this.notify));
	                }
	                else {
	                    this.promise.$$state.value = val;
	                    this.promise.$$state.status = 1;
	                    scheduleProcessQueue(this.promise.$$state);
	                }
	            }
	            catch (e) {
	                rejectPromise(e);
	                exceptionHandler(e);
	            }
	            function resolvePromise(val) {
	                if (done)
	                    return;
	                done = true;
	                that.$$resolve(val);
	            }
	            function rejectPromise(val) {
	                if (done)
	                    return;
	                done = true;
	                that.$$reject(val);
	            }
	        },
	        reject: function (reason) {
	            if (this.promise.$$state.status)
	                return;
	            engineQueue.decr();
	            this.$$reject(reason);
	        },
	        $$reject: function (reason) {
	            this.promise.$$state.value = reason;
	            this.promise.$$state.status = 2;
	            scheduleProcessQueue(this.promise.$$state);
	        },
	        notify: function (progress) {
	            var callbacks = this.promise.$$state.pending;
	            if ((this.promise.$$state.status <= 0) && callbacks && callbacks.length) {
	                nextTick(function () {
	                    var callback, result;
	                    for (var i = 0, ii = callbacks.length; i < ii; i++) {
	                        result = callbacks[i][0];
	                        callback = callbacks[i][3];
	                        try {
	                            result.notify(Angular_1.isFunction(callback) ? callback(progress) : progress);
	                        }
	                        catch (e) {
	                            exceptionHandler(e);
	                        }
	                    }
	                });
	            }
	        }
	    });
	    /**
	     * @ngdoc method
	     * @name $q#reject
	     * @kind function
	     *
	     * @description
	     * Creates a promise that is resolved as rejected with the specified `reason`. This api should be
	     * used to forward rejection in a chain of promises. If you are dealing with the last promise in
	     * a promise chain, you don't need to worry about it.
	     *
	     * When comparing deferreds/promises to the familiar behavior of try/catch/throw, think of
	     * `reject` as the `throw` keyword in JavaScript. This also means that if you "catch" an error via
	     * a promise error callback and you want to forward the error to the promise derived from the
	     * current promise, you have to "rethrow" the error by returning a rejection constructed via
	     * `reject`.
	     *
	     * ```js
	     *   promiseB = promiseA.then(function(result) {
	   *     // success: do something and resolve promiseB
	   *     //          with the old or a new result
	   *     return result;
	   *   }, function(reason) {
	   *     // error: handle the error if possible and
	   *     //        resolve promiseB with newPromiseOrValue,
	   *     //        otherwise forward the rejection to promiseB
	   *     if (canHandle(reason)) {
	   *      // handle the error and recover
	   *      return newPromiseOrValue;
	   *     }
	   *     return $q.reject(reason);
	   *   });
	     * ```
	     *
	     * @param {*} reason Constant, message, exception or an object representing the rejection reason.
	     * @returns {Promise} Returns a promise that was already resolved as rejected with the `reason`.
	     */
	    var reject = function (reason) {
	        var result = new Deferred();
	        result.reject(reason);
	        return result.promise;
	    };
	    var makePromise = function makePromise(value, resolved) {
	        var result = new Deferred();
	        if (resolved) {
	            result.resolve(value);
	        }
	        else {
	            result.reject(value);
	        }
	        return result.promise;
	    };
	    var handleCallback = function handleCallback(value, isResolved, callback) {
	        var callbackOutput = null;
	        try {
	            if (Angular_1.isFunction(callback))
	                callbackOutput = callback();
	        }
	        catch (e) {
	            return makePromise(e, false);
	        }
	        if (Angular_1.isPromiseLike(callbackOutput)) {
	            return callbackOutput.then(function () {
	                return makePromise(value, isResolved);
	            }, function (error) {
	                return makePromise(error, false);
	            });
	        }
	        else {
	            return makePromise(value, isResolved);
	        }
	    };
	    /**
	     * @ngdoc method
	     * @name $q#when
	     * @kind function
	     *
	     * @description
	     * Wraps an object that might be a value or a (3rd party) then-able promise into a $q promise.
	     * This is useful when you are dealing with an object that might or might not be a promise, or if
	     * the promise comes from a source that can't be trusted.
	     *
	     * @param {*} value Value or a promise
	     * @param {Function=} successCallback
	     * @param {Function=} errorCallback
	     * @param {Function=} progressCallback
	     * @returns {Promise} Returns a promise of the passed value or promise
	     */
	    var when = function (value, callback, errback, progressBack) {
	        var result = new Deferred();
	        result.resolve(value);
	        return result.promise.then(callback, errback, progressBack);
	    };
	    /**
	     * @ngdoc method
	     * @name $q#resolve
	     * @kind function
	     *
	     * @description
	     * Alias of {@link ng.$q#when when} to maintain naming consistency with ES6.
	     *
	     * @param {*} value Value or a promise
	     * @param {Function=} successCallback
	     * @param {Function=} errorCallback
	     * @param {Function=} progressCallback
	     * @returns {Promise} Returns a promise of the passed value or promise
	     */
	    var resolve = when;
	    /**
	     * @ngdoc method
	     * @name $q#all
	     * @kind function
	     *
	     * @description
	     * Combines multiple promises into a single promise that is resolved when all of the input
	     * promises are resolved.
	     *
	     * @param {Array.<Promise>|Object.<Promise>} promises An array or hash of promises.
	     * @returns {Promise} Returns a single promise that will be resolved with an array/hash of values,
	     *   each value corresponding to the promise at the same index/key in the `promises` array/hash.
	     *   If any of the promises is resolved with a rejection, this resulting promise will be rejected
	     *   with the same rejection value.
	     */
	    function all(promises) {
	        var deferred = new Deferred(), counter = 0, results = Angular_1.isArray(promises) ? [] : {};
	        Angular_1.forEach(promises, function (promise, key) {
	            counter++;
	            when(promise).then(function (value) {
	                if (results.hasOwnProperty(key))
	                    return;
	                results[key] = value;
	                if (!(--counter))
	                    deferred.resolve(results);
	            }, function (reason) {
	                if (results.hasOwnProperty(key))
	                    return;
	                deferred.reject(reason);
	            });
	        });
	        if (counter === 0) {
	            deferred.resolve(results);
	        }
	        return deferred.promise;
	    }
	    /**
	     * @ngdoc method
	     * @name $q#race
	     * @kind function
	     *
	     * @description
	     * Returns a promise that resolves or rejects as soon as one of those promises
	     * resolves or rejects, with the value or reason from that promise.
	     *
	     * @param {Array.<Promise>|Object.<Promise>} promises An array or hash of promises.
	     * @returns {Promise} a promise that resolves or rejects as soon as one of the `promises`
	     * resolves or rejects, with the value or reason from that promise.
	     */
	    function race(promises) {
	        var deferred = defer();
	        Angular_1.forEach(promises, function (promise) {
	            when(promise).then(deferred.resolve, deferred.reject);
	        });
	        return deferred.promise;
	    }
	    var $Q = function Q(resolver) {
	        if (!Angular_1.isFunction(resolver)) {
	            throw $qMinErr('norslvr', "Expected resolverFn, got '{0}'", resolver);
	        }
	        var deferred = new Deferred();
	        function resolveFn(value) {
	            deferred.resolve(value);
	        }
	        function rejectFn(reason) {
	            deferred.reject(reason);
	        }
	        resolver(resolveFn, rejectFn);
	        return deferred.promise;
	    };
	    // Let's make the instanceof operator work for promises, so that
	    // `new $q(fn) instanceof $q` would evaluate to true.
	    $Q.prototype = Promise.prototype;
	    $Q.defer = defer;
	    $Q.reject = reject;
	    $Q.when = when;
	    $Q.resolve = resolve;
	    $Q.all = all;
	    $Q.race = race;
	    return $Q;
	}


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	/* We need to tell jshint what variables are being exported */
	/* global angular: true,
	  msie: true,
	  jqLite: true,
	  jQuery: true,
	  slice: true,
	  splice: true,
	  push: true,
	  toString: true,
	  ngMinErr: true,
	  angularModule: true,
	  uid: true,
	  REGEX_STRING_REGEXP: true,
	  VALIDITY_STATE_PROPERTY: true,

	  lowercase: true,
	  uppercase: true,
	  manualLowercase: true,
	  manualUppercase: true,
	  nodeName_: true,
	  isArrayLike: true,
	  forEach: true,
	  forEachSorted: true,
	  reverseParams: true,
	  nextUid: true,
	  setHashKey: true,
	  extend: true,
	  toInt: true,
	  inherit: true,
	  merge: true,
	  noop: true,
	  identity: true,
	  valueFn: true,
	  isUndefined: true,
	  isDefined: true,
	  isObject: true,
	  isBlankObject: true,
	  isString: true,
	  isNumber: true,
	  isDate: true,
	  isArray: true,
	  isFunction: true,
	  isRegExp: true,
	  isWindow: true,
	  isScope: true,
	  isFile: true,
	  isFormData: true,
	  isBlob: true,
	  isBoolean: true,
	  isPromiseLike: true,
	  trim: true,
	  escapeForRegexp: true,
	  isElement: true,
	  makeMap: true,
	  includes: true,
	  arrayRemove: true,
	  copy: true,
	  equals: true,
	  csp: true,
	  jq: true,
	  concat: true,
	  sliceArgs: true,
	  bind: true,
	  toJsonReplacer: true,
	  toJson: true,
	  fromJson: true,
	  convertTimezoneToLocal: true,
	  timezoneToOffset: true,
	  startingTag: true,
	  tryDecodeURIComponent: true,
	  parseKeyValue: true,
	  toKeyValue: true,
	  encodeUriSegment: true,
	  encodeUriQuery: true,
	  angularInit: true,
	  bootstrap: true,
	  getTestability: true,
	  snake_case: true,
	  bindJQuery: true,
	  assertArg: true,
	  assertArgFn: true,
	  assertNotHasOwnProperty: true,
	  getter: true,
	  getBlockNodes: true,
	  hasOwnProperty: true,
	  createMap: true,
	  stringify: true,

	  NODE_TYPE_ELEMENT: true,
	  NODE_TYPE_ATTRIBUTE: true,
	  NODE_TYPE_TEXT: true,
	  NODE_TYPE_COMMENT: true,
	  NODE_TYPE_DOCUMENT: true,
	  NODE_TYPE_DOCUMENT_FRAGMENT: true,
	*/
	////////////////////////////////////
	/**
	 * @ngdoc module
	 * @name ng
	 * @module ng
	 * @installation
	 * @description
	 *
	 * # ng (core module)
	 * The ng module is loaded by default when an AngularJS application is started. The module itself
	 * contains the essential components for an AngularJS application to function. The table below
	 * lists a high level breakdown of each of the services/factories, filters, directives and testing
	 * components available within this core module.
	 *
	 * <div doc-module-components="ng"></div>
	 */
	var REGEX_STRING_REGEXP = /^\/(.+)\/([a-z]*)$/;
	// The name of a form control's ValidityState property.
	// This is used so that it's possible for internal tests to create mock ValidityStates.
	var VALIDITY_STATE_PROPERTY = 'validity';
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var lowercase = function (string) { return isString(string) ? string.toLowerCase() : string; };
	var uppercase = function (string) { return isString(string) ? string.toUpperCase() : string; };
	var manualLowercase = function (s) {
	    /* jshint bitwise: false */
	    return isString(s)
	        ? s.replace(/[A-Z]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) | 32); })
	        : s;
	};
	var manualUppercase = function (s) {
	    /* jshint bitwise: false */
	    return isString(s)
	        ? s.replace(/[a-z]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) & ~32); })
	        : s;
	};
	// String#toLowerCase and String#toUpperCase don't produce correct results in browsers with Turkish
	// locale, for this reason we need to detect this case and redefine lowercase/uppercase methods
	// with correct but slower alternatives. See https://github.com/angular/angular.js/issues/11387
	if ('i' !== 'I'.toLowerCase()) {
	    lowercase = manualLowercase;
	    uppercase = manualUppercase;
	}
	function minErr(module, ErrorConstructor) {
	    ErrorConstructor = ErrorConstructor || Error;
	    return function () {
	        var SKIP_INDEXES = 2;
	        var templateArgs = arguments, code = templateArgs[0], message = '[' + (module ? module + ':' : '') + code + '] ', template = templateArgs[1], paramPrefix, i;
	        message += template.replace(/\{\d+\}/g, function (match) {
	            var index = +match.slice(1, -1), shiftedIndex = index + SKIP_INDEXES;
	            if (shiftedIndex < templateArgs.length) {
	                return toDebugString(templateArgs[shiftedIndex]);
	            }
	            return match;
	        });
	        message += '\nhttp://errors.angularjs.org/"NG_VERSION_FULL"/' +
	            (module ? module + '/' : '') + code;
	        for (i = SKIP_INDEXES, paramPrefix = '?'; i < templateArgs.length; i++, paramPrefix = '&') {
	            message += paramPrefix + 'p' + (i - SKIP_INDEXES) + '=' +
	                encodeURIComponent(toDebugString(templateArgs[i]));
	        }
	        return new ErrorConstructor(message);
	    };
	}
	exports.minErr = minErr;
	var msie, // holds major version number for IE, or NaN if UA is not IE.
	jqLite, // delay binding since jQuery could be loaded after us.
	jQuery, // delay binding
	slice = [].slice, splice = [].splice, push = [].push, toString = Object.prototype.toString, getPrototypeOf = Object.getPrototypeOf, ngMinErr = minErr('ng', null), 
	/** @name angular */
	angular = window.angular || (window.angular = {}), angularModule, uid = 0;
	/**
	 * documentMode is an IE-only property
	 * http://msdn.microsoft.com/en-us/library/ie/cc196988(v=vs.85).aspx
	 */
	msie = window.document.documentMode;
	/**
	 * @private
	 * @param {*} obj
	 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
	 *                   String ...)
	 */
	function isArrayLike(obj) {
	    // `null`, `undefined` and `window` are not array-like
	    if (obj == null || isWindow(obj))
	        return false;
	    // arrays, strings and jQuery/jqLite objects are array like
	    // * jqLite is either the jQuery or jqLite constructor function
	    // * we have to check the existence of jqLite first as this method is called
	    //   via the forEach method when constructing the jqLite object in the first place
	    if (exports.isArray(obj) || isString(obj) || (jqLite && obj instanceof jqLite))
	        return true;
	    // Support: iOS 8.2 (not reproducible in simulator)
	    // "length" in obj used to prevent JIT error (gh-11508)
	    var length = "length" in Object(obj) && obj.length;
	    // NodeList objects (with `item` method) and
	    // other objects with suitable length characteristics are array-like
	    return isNumber(length) &&
	        (length >= 0 && ((length - 1) in obj || obj instanceof Array) || typeof obj.item === 'function');
	}
	exports.isArrayLike = isArrayLike;
	/**
	 * @ngdoc function
	 * @name angular.forEach
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Invokes the `iterator` function once for each item in `obj` collection, which can be either an
	 * object or an array. The `iterator` function is invoked with `iterator(value, key, obj)`, where `value`
	 * is the value of an object property or an array element, `key` is the object property key or
	 * array element index and obj is the `obj` itself. Specifying a `context` for the function is optional.
	 *
	 * It is worth noting that `.forEach` does not iterate over inherited properties because it filters
	 * using the `hasOwnProperty` method.
	 *
	 * Unlike ES262's
	 * [Array.prototype.forEach](http://www.ecma-international.org/ecma-262/5.1/#sec-15.4.4.18),
	 * providing 'undefined' or 'null' values for `obj` will not throw a TypeError, but rather just
	 * return the value provided.
	 *
	   ```js
	     var values = {name: 'misko', gender: 'male'};
	     var log = [];
	     angular.forEach(values, function(value, key) {
	       this.push(key + ': ' + value);
	     }, log);
	     expect(log).toEqual(['name: misko', 'gender: male']);
	   ```
	 *
	 * @param {Object|Array} obj Object to iterate over.
	 * @param {Function} iterator Iterator function.
	 * @param {Object=} context Object to become context (`this`) for the iterator function.
	 * @returns {Object|Array} Reference to `obj`.
	 */
	function forEach(obj, iterator, context) {
	    var key, length;
	    if (obj) {
	        if (isFunction(obj)) {
	            for (key in obj) {
	                if (key !== 'prototype' && key !== 'length' && key !== 'name' && obj.hasOwnProperty(key)) {
	                    iterator.call(context, obj[key], key, obj);
	                }
	            }
	        }
	        else if (exports.isArray(obj) || isArrayLike(obj)) {
	            var isPrimitive = typeof obj !== 'object';
	            for (key = 0, length = obj.length; key < length; key++) {
	                if (isPrimitive || key in obj) {
	                    iterator.call(context, obj[key], key, obj);
	                }
	            }
	        }
	        else if (obj.forEach && obj.forEach !== forEach) {
	            obj.forEach(iterator, context, obj);
	        }
	        else if (isBlankObject(obj)) {
	            // createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
	            for (key in obj) {
	                iterator.call(context, obj[key], key, obj);
	            }
	        }
	        else if (typeof obj.hasOwnProperty === 'function') {
	            // Slow path for objects inheriting Object.prototype, hasOwnProperty check needed
	            for (key in obj) {
	                if (obj.hasOwnProperty(key)) {
	                    iterator.call(context, obj[key], key, obj);
	                }
	            }
	        }
	        else {
	            // Slow path for objects which do not have a method `hasOwnProperty`
	            for (key in obj) {
	                if (hasOwnProperty.call(obj, key)) {
	                    iterator.call(context, obj[key], key, obj);
	                }
	            }
	        }
	    }
	    return obj;
	}
	exports.forEach = forEach;
	function forEachSorted(obj, iterator, context) {
	    var keys = Object.keys(obj).sort();
	    for (var i = 0; i < keys.length; i++) {
	        iterator.call(context, obj[keys[i]], keys[i]);
	    }
	    return keys;
	}
	exports.forEachSorted = forEachSorted;
	/**
	 * when using forEach the params are value, key, but it is often useful to have key, value.
	 * @param {function(string, *)} iteratorFn
	 * @returns {function(*, string)}
	 */
	function reverseParams(iteratorFn) {
	    return function (value, key) { iteratorFn(key, value); };
	}
	exports.reverseParams = reverseParams;
	/**
	 * A consistent way of creating unique IDs in angular.
	 *
	 * Using simple numbers allows us to generate 28.6 million unique ids per second for 10 years before
	 * we hit number precision issues in JavaScript.
	 *
	 * Math.pow(2,53) / 60 / 60 / 24 / 365 / 10 = 28.6M
	 *
	 * @returns {number} an unique alpha-numeric string
	 */
	function nextUid() {
	    return ++uid;
	}
	exports.nextUid = nextUid;
	/**
	 * Set or clear the hashkey for an object.
	 * @param obj object
	 * @param h the hashkey (!truthy to delete the hashkey)
	 */
	function setHashKey(obj, h) {
	    if (h) {
	        obj.$$hashKey = h;
	    }
	    else {
	        delete obj.$$hashKey;
	    }
	}
	exports.setHashKey = setHashKey;
	function baseExtend(dst, objs, deep) {
	    var h = dst.$$hashKey;
	    for (var i = 0, ii = objs.length; i < ii; ++i) {
	        var obj = objs[i];
	        if (!isObject(obj) && !isFunction(obj))
	            continue;
	        var keys = Object.keys(obj);
	        for (var j = 0, jj = keys.length; j < jj; j++) {
	            var key = keys[j];
	            var src = obj[key];
	            if (deep && isObject(src)) {
	                if (isDate(src)) {
	                    dst[key] = new Date(src.valueOf());
	                }
	                else if (isRegExp(src)) {
	                    dst[key] = new RegExp(src);
	                }
	                else if (src.nodeName) {
	                    dst[key] = src.cloneNode(true);
	                }
	                else if (isElement(src)) {
	                    dst[key] = src.clone();
	                }
	                else {
	                    if (!isObject(dst[key]))
	                        dst[key] = exports.isArray(src) ? [] : {};
	                    baseExtend(dst[key], [src], true);
	                }
	            }
	            else {
	                dst[key] = src;
	            }
	        }
	    }
	    setHashKey(dst, h);
	    return dst;
	}
	exports.baseExtend = baseExtend;
	/**
	 * @ngdoc function
	 * @name angular.extend
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
	 * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
	 * by passing an empty object as the target: `var object = angular.extend({}, object1, object2)`.
	 *
	 * **Note:** Keep in mind that `angular.extend` does not support recursive merge (deep copy). Use
	 * {@link angular.merge} for this.
	 *
	 * @param {Object} dst Destination object.
	 * @param {...Object} src Source object(s).
	 * @returns {Object} Reference to `dst`.
	 */
	function extend(dst) {
	    return baseExtend(dst, slice.call(arguments, 1), false);
	}
	exports.extend = extend;
	/**
	* @ngdoc function
	* @name angular.merge
	* @module ng
	* @kind function
	*
	* @description
	* Deeply extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
	* to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
	* by passing an empty object as the target: `var object = angular.merge({}, object1, object2)`.
	*
	* Unlike {@link angular.extend extend()}, `merge()` recursively descends into object properties of source
	* objects, performing a deep copy.
	*
	* @param {Object} dst Destination object.
	* @param {...Object} src Source object(s).
	* @returns {Object} Reference to `dst`.
	*/
	function merge(dst) {
	    return baseExtend(dst, slice.call(arguments, 1), true);
	}
	exports.merge = merge;
	function toInt(str) {
	    return parseInt(str, 10);
	}
	exports.toInt = toInt;
	function inherit(parent, extra) {
	    return extend(Object.create(parent), extra);
	}
	exports.inherit = inherit;
	/**
	 * @ngdoc function
	 * @name angular.noop
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * A function that performs no operations. This function can be useful when writing code in the
	 * functional style.
	   ```js
	     function foo(callback) {
	       var result = calculateResult();
	       (callback || angular.noop)(result);
	     }
	   ```
	 */
	function noop() { }
	exports.noop = noop;
	noop.$inject = [];
	/**
	 * @ngdoc function
	 * @name angular.identity
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * A function that returns its first argument. This function is useful when writing code in the
	 * functional style.
	 *
	   ```js
	   function transformer(transformationFn, value) {
	     return (transformationFn || angular.identity)(value);
	   };

	   // E.g.
	   function getResult(fn, input) {
	     return (fn || angular.identity)(input);
	   };

	   getResult(function(n) { return n * 2; }, 21);   // returns 42
	   getResult(null, 21);                            // returns 21
	   getResult(undefined, 21);                       // returns 21
	   ```
	 *
	 * @param {*} value to be returned.
	 * @returns {*} the value passed in.
	 */
	function identity($) { return $; }
	exports.identity = identity;
	identity.$inject = [];
	function valueFn(value) { return function valueRef() { return value; }; }
	exports.valueFn = valueFn;
	function hasCustomToString(obj) {
	    return isFunction(obj.toString) && obj.toString !== toString;
	}
	exports.hasCustomToString = hasCustomToString;
	/**
	 * @ngdoc function
	 * @name angular.isUndefined
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a reference is undefined.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is undefined.
	 */
	function isUndefined(value) { return typeof value === 'undefined'; }
	exports.isUndefined = isUndefined;
	/**
	 * @ngdoc function
	 * @name angular.isDefined
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a reference is defined.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is defined.
	 */
	function isDefined(value) { return typeof value !== 'undefined'; }
	exports.isDefined = isDefined;
	/**
	 * @ngdoc function
	 * @name angular.isObject
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a reference is an `Object`. Unlike `typeof` in JavaScript, `null`s are not
	 * considered to be objects. Note that JavaScript arrays are objects.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is an `Object` but not `null`.
	 */
	function isObject(value) {
	    // http://jsperf.com/isobject4
	    return value !== null && typeof value === 'object';
	}
	exports.isObject = isObject;
	/**
	 * Determine if a value is an object with a null prototype
	 *
	 * @returns {boolean} True if `value` is an `Object` with a null prototype
	 */
	function isBlankObject(value) {
	    return value !== null && typeof value === 'object' && !getPrototypeOf(value);
	}
	exports.isBlankObject = isBlankObject;
	/**
	 * @ngdoc function
	 * @name angular.isString
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a reference is a `String`.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `String`.
	 */
	function isString(value) { return typeof value === 'string'; }
	exports.isString = isString;
	/**
	 * @ngdoc function
	 * @name angular.isNumber
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a reference is a `Number`.
	 *
	 * This includes the "special" numbers `NaN`, `+Infinity` and `-Infinity`.
	 *
	 * If you wish to exclude these then you can use the native
	 * [`isFinite'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isFinite)
	 * method.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `Number`.
	 */
	function isNumber(value) { return typeof value === 'number'; }
	exports.isNumber = isNumber;
	/**
	 * @ngdoc function
	 * @name angular.isDate
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a value is a date.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `Date`.
	 */
	function isDate(value) {
	    return toString.call(value) === '[object Date]';
	}
	exports.isDate = isDate;
	/**
	 * @ngdoc function
	 * @name angular.isArray
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a reference is an `Array`.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is an `Array`.
	 */
	exports.isArray = Array.isArray;
	/**
	 * @ngdoc function
	 * @name angular.isFunction
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a reference is a `Function`.
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `Function`.
	 */
	function isFunction(value) { return typeof value === 'function'; }
	exports.isFunction = isFunction;
	/**
	 * Determines if a value is a regular expression object.
	 *
	 * @private
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a `RegExp`.
	 */
	function isRegExp(value) {
	    return toString.call(value) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;
	/**
	 * Checks if `obj` is a window object.
	 *
	 * @private
	 * @param {*} obj Object to check
	 * @returns {boolean} True if `obj` is a window obj.
	 */
	function isWindow(obj) {
	    return obj && obj.window === obj;
	}
	exports.isWindow = isWindow;
	function isScope(obj) {
	    return obj && obj.$evalAsync && obj.$watch;
	}
	exports.isScope = isScope;
	function isFile(obj) {
	    return toString.call(obj) === '[object File]';
	}
	exports.isFile = isFile;
	function isFormData(obj) {
	    return toString.call(obj) === '[object FormData]';
	}
	exports.isFormData = isFormData;
	function isBlob(obj) {
	    return toString.call(obj) === '[object Blob]';
	}
	exports.isBlob = isBlob;
	function isBoolean(value) {
	    return typeof value === 'boolean';
	}
	exports.isBoolean = isBoolean;
	function isPromiseLike(obj) {
	    return obj && isFunction(obj.then);
	}
	exports.isPromiseLike = isPromiseLike;
	var TYPED_ARRAY_REGEXP = /^\[object (?:Uint8|Uint8Clamped|Uint16|Uint32|Int8|Int16|Int32|Float32|Float64)Array\]$/;
	function isTypedArray(value) {
	    return value && isNumber(value.length) && TYPED_ARRAY_REGEXP.test(toString.call(value));
	}
	exports.isTypedArray = isTypedArray;
	function isArrayBuffer(obj) {
	    return toString.call(obj) === '[object ArrayBuffer]';
	}
	exports.isArrayBuffer = isArrayBuffer;
	exports.trim = function (value) {
	    return isString(value) ? value.trim() : value;
	};
	// Copied from:
	// http://docs.closure-library.googlecode.com/git/local_closure_goog_string_string.js.source.html#line1021
	// Prereq: s is a string.
	exports.escapeForRegexp = function (s) {
	    return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
	        replace(/\x08/g, '\\x08');
	};
	/**
	 * @ngdoc function
	 * @name angular.isElement
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if a reference is a DOM element (or wrapped jQuery element).
	 *
	 * @param {*} value Reference to check.
	 * @returns {boolean} True if `value` is a DOM element (or wrapped jQuery element).
	 */
	function isElement(node) {
	    return !!(node &&
	        (node.nodeName // We are a direct element.
	            || (node.prop && node.attr && node.find))); // We have an on and find method part of jQuery API.
	}
	exports.isElement = isElement;
	/**
	 * @param str 'key1,key2,...'
	 * @returns {object} in the form of {key1:true, key2:true, ...}
	 */
	function makeMap(str) {
	    var obj = {}, items = str.split(','), i;
	    for (i = 0; i < items.length; i++) {
	        obj[items[i]] = true;
	    }
	    return obj;
	}
	exports.makeMap = makeMap;
	function nodeName_(element) {
	    return lowercase(element.nodeName || (element[0] && element[0].nodeName));
	}
	exports.nodeName_ = nodeName_;
	function includes(array, obj) {
	    return Array.prototype.indexOf.call(array, obj) !== -1;
	}
	exports.includes = includes;
	function arrayRemove(array, value) {
	    var index = array.indexOf(value);
	    if (index >= 0) {
	        array.splice(index, 1);
	    }
	    return index;
	}
	exports.arrayRemove = arrayRemove;
	/**
	 * @ngdoc function
	 * @name angular.copy
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Creates a deep copy of `source`, which should be an object or an array.
	 *
	 * * If no destination is supplied, a copy of the object or array is created.
	 * * If a destination is provided, all of its elements (for arrays) or properties (for objects)
	 *   are deleted and then all elements/properties from the source are copied to it.
	 * * If `source` is not an object or array (inc. `null` and `undefined`), `source` is returned.
	 * * If `source` is identical to `destination` an exception will be thrown.
	 *
	 * <br />
	 * <div class="alert alert-warning">
	 *   Only enumerable properties are taken into account. Non-enumerable properties (both on `source`
	 *   and on `destination`) will be ignored.
	 * </div>
	 *
	 * @param {*} source The source that will be used to make a copy.
	 *                   Can be any type, including primitives, `null`, and `undefined`.
	 * @param {(Object|Array)=} destination Destination into which the source is copied. If
	 *     provided, must be of the same type as `source`.
	 * @returns {*} The copy or updated `destination`, if `destination` was specified.
	 *
	 * @example
	  <example module="copyExample">
	    <file name="index.html">
	      <div ng-controller="ExampleController">
	        <form novalidate class="simple-form">
	          <label>Name: <input type="text" ng-model="user.name" /></label><br />
	          <label>Age:  <input type="number" ng-model="user.age" /></label><br />
	          Gender: <label><input type="radio" ng-model="user.gender" value="male" />male</label>
	                  <label><input type="radio" ng-model="user.gender" value="female" />female</label><br />
	          <button ng-click="reset()">RESET</button>
	          <button ng-click="update(user)">SAVE</button>
	        </form>
	        <pre>form = {{user | json}}</pre>
	        <pre>master = {{master | json}}</pre>
	      </div>
	    </file>
	    <file name="script.js">
	      // Module: copyExample
	      angular.
	        module('copyExample', []).
	        controller('ExampleController', ['$scope', function($scope) {
	          $scope.master = {};

	          $scope.reset = function() {
	            // Example with 1 argument
	            $scope.user = angular.copy($scope.master);
	          };

	          $scope.update = function(user) {
	            // Example with 2 arguments
	            angular.copy(user, $scope.master);
	          };

	          $scope.reset();
	        }]);
	    </file>
	  </example>
	 */
	function copy(source, destination) {
	    var stackSource = [];
	    var stackDest = [];
	    if (destination) {
	        if (isTypedArray(destination) || isArrayBuffer(destination)) {
	            throw ngMinErr('cpta', "Can't copy! TypedArray destination cannot be mutated.");
	        }
	        if (source === destination) {
	            throw ngMinErr('cpi', "Can't copy! Source and destination are identical.");
	        }
	        // Empty the destination object
	        if (exports.isArray(destination)) {
	            destination.length = 0;
	        }
	        else {
	            forEach(destination, function (value, key) {
	                if (key !== '$$hashKey') {
	                    delete destination[key];
	                }
	            });
	        }
	        stackSource.push(source);
	        stackDest.push(destination);
	        return copyRecurse(source, destination);
	    }
	    return copyElement(source);
	    function copyRecurse(source, destination) {
	        var h = destination.$$hashKey;
	        var key;
	        if (exports.isArray(source)) {
	            for (var i = 0, ii = source.length; i < ii; i++) {
	                destination.push(copyElement(source[i]));
	            }
	        }
	        else if (isBlankObject(source)) {
	            // createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
	            for (key in source) {
	                destination[key] = copyElement(source[key]);
	            }
	        }
	        else if (source && typeof source.hasOwnProperty === 'function') {
	            // Slow path, which must rely on hasOwnProperty
	            for (key in source) {
	                if (source.hasOwnProperty(key)) {
	                    destination[key] = copyElement(source[key]);
	                }
	            }
	        }
	        else {
	            // Slowest path --- hasOwnProperty can't be called as a method
	            for (key in source) {
	                if (hasOwnProperty.call(source, key)) {
	                    destination[key] = copyElement(source[key]);
	                }
	            }
	        }
	        setHashKey(destination, h);
	        return destination;
	    }
	    function copyElement(source) {
	        // Simple values
	        if (!isObject(source)) {
	            return source;
	        }
	        // Already copied values
	        var index = stackSource.indexOf(source);
	        if (index !== -1) {
	            return stackDest[index];
	        }
	        if (isWindow(source) || isScope(source)) {
	            throw ngMinErr('cpws', "Can't copy! Making copies of Window or Scope instances is not supported.");
	        }
	        var needsRecurse = false;
	        var destination = copyType(source);
	        if (destination === undefined) {
	            destination = exports.isArray(source) ? [] : Object.create(getPrototypeOf(source));
	            needsRecurse = true;
	        }
	        stackSource.push(source);
	        stackDest.push(destination);
	        return needsRecurse
	            ? copyRecurse(source, destination)
	            : destination;
	    }
	    function copyType(source) {
	        switch (toString.call(source)) {
	            case '[object Int8Array]':
	            case '[object Int16Array]':
	            case '[object Int32Array]':
	            case '[object Float32Array]':
	            case '[object Float64Array]':
	            case '[object Uint8Array]':
	            case '[object Uint8ClampedArray]':
	            case '[object Uint16Array]':
	            case '[object Uint32Array]':
	                return new source.constructor(copyElement(source.buffer), source.byteOffset, source.length);
	            case '[object ArrayBuffer]':
	                //Support: IE10
	                if (!source.slice) {
	                    var copied = new ArrayBuffer(source.byteLength);
	                    new Uint8Array(copied).set(new Uint8Array(source));
	                    return copied;
	                }
	                return source.slice(0);
	            case '[object Boolean]':
	            case '[object Number]':
	            case '[object String]':
	            case '[object Date]':
	                return new source.constructor(source.valueOf());
	            case '[object RegExp]':
	                var re = new RegExp(source.source, source.toString().match(/[^\/]*$/)[0]);
	                re.lastIndex = source.lastIndex;
	                return re;
	            case '[object Blob]':
	                return new source.constructor([source], { type: source.type });
	        }
	        if (isFunction(source.cloneNode)) {
	            return source.cloneNode(true);
	        }
	    }
	}
	exports.copy = copy;
	/**
	 * @ngdoc function
	 * @name angular.equals
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Determines if two objects or two values are equivalent. Supports value types, regular
	 * expressions, arrays and objects.
	 *
	 * Two objects or values are considered equivalent if at least one of the following is true:
	 *
	 * * Both objects or values pass `===` comparison.
	 * * Both objects or values are of the same type and all of their properties are equal by
	 *   comparing them with `angular.equals`.
	 * * Both values are NaN. (In JavaScript, NaN == NaN => false. But we consider two NaN as equal)
	 * * Both values represent the same regular expression (In JavaScript,
	 *   /abc/ == /abc/ => false. But we consider two regular expressions as equal when their textual
	 *   representation matches).
	 *
	 * During a property comparison, properties of `function` type and properties with names
	 * that begin with `$` are ignored.
	 *
	 * Scope and DOMWindow objects are being compared only by identify (`===`).
	 *
	 * @param {*} o1 Object or value to compare.
	 * @param {*} o2 Object or value to compare.
	 * @returns {boolean} True if arguments are equal.
	 *
	 * @example
	   <example module="equalsExample" name="equalsExample">
	     <file name="index.html">
	      <div ng-controller="ExampleController">
	        <form novalidate>
	          <h3>User 1</h3>
	          Name: <input type="text" ng-model="user1.name">
	          Age: <input type="number" ng-model="user1.age">

	          <h3>User 2</h3>
	          Name: <input type="text" ng-model="user2.name">
	          Age: <input type="number" ng-model="user2.age">

	          <div>
	            <br/>
	            <input type="button" value="Compare" ng-click="compare()">
	          </div>
	          User 1: <pre>{{user1 | json}}</pre>
	          User 2: <pre>{{user2 | json}}</pre>
	          Equal: <pre>{{result}}</pre>
	        </form>
	      </div>
	    </file>
	    <file name="script.js">
	        angular.module('equalsExample', []).controller('ExampleController', ['$scope', function($scope) {
	          $scope.user1 = {};
	          $scope.user2 = {};
	          $scope.result;
	          $scope.compare = function() {
	            $scope.result = angular.equals($scope.user1, $scope.user2);
	          };
	        }]);
	    </file>
	  </example>
	 */
	function equals(o1, o2) {
	    if (o1 === o2)
	        return true;
	    if (o1 === null || o2 === null)
	        return false;
	    if (o1 !== o1 && o2 !== o2)
	        return true; // NaN === NaN
	    var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
	    if (t1 === t2 && t1 === 'object') {
	        if (exports.isArray(o1)) {
	            if (!exports.isArray(o2))
	                return false;
	            if ((length = o1.length) === o2.length) {
	                for (key = 0; key < length; key++) {
	                    if (!equals(o1[key], o2[key]))
	                        return false;
	                }
	                return true;
	            }
	        }
	        else if (isDate(o1)) {
	            if (!isDate(o2))
	                return false;
	            return equals(o1.getTime(), o2.getTime());
	        }
	        else if (isRegExp(o1)) {
	            if (!isRegExp(o2))
	                return false;
	            return o1.toString() === o2.toString();
	        }
	        else {
	            if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2) ||
	                exports.isArray(o2) || isDate(o2) || isRegExp(o2))
	                return false;
	            keySet = createMap();
	            for (key in o1) {
	                if (key.charAt(0) === '$' || isFunction(o1[key]))
	                    continue;
	                if (!equals(o1[key], o2[key]))
	                    return false;
	                keySet[key] = true;
	            }
	            for (key in o2) {
	                if (!(key in keySet) &&
	                    key.charAt(0) !== '$' &&
	                    isDefined(o2[key]) &&
	                    !isFunction(o2[key]))
	                    return false;
	            }
	            return true;
	        }
	    }
	    return false;
	}
	exports.equals = equals;
	exports.csp = function () {
	    if (!isDefined(exports.csp.rules)) {
	        var ngCspElement = (window.document.querySelector('[ng-csp]') ||
	            window.document.querySelector('[data-ng-csp]'));
	        if (ngCspElement) {
	            var ngCspAttribute = ngCspElement.getAttribute('ng-csp') ||
	                ngCspElement.getAttribute('data-ng-csp');
	            exports.csp.rules = {
	                noUnsafeEval: !ngCspAttribute || (ngCspAttribute.indexOf('no-unsafe-eval') !== -1),
	                noInlineStyle: !ngCspAttribute || (ngCspAttribute.indexOf('no-inline-style') !== -1)
	            };
	        }
	        else {
	            exports.csp.rules = {
	                noUnsafeEval: noUnsafeEval(),
	                noInlineStyle: false
	            };
	        }
	    }
	    return exports.csp.rules;
	    function noUnsafeEval() {
	        try {
	            /* jshint -W031, -W054 */
	            new Function('');
	            /* jshint +W031, +W054 */
	            return false;
	        }
	        catch (e) {
	            return true;
	        }
	    }
	};
	/**
	 * @ngdoc directive
	 * @module ng
	 * @name ngJq
	 *
	 * @element ANY
	 * @param {string=} ngJq the name of the library available under `window`
	 * to be used for angular.element
	 * @description
	 * Use this directive to force the angular.element library.  This should be
	 * used to force either jqLite by leaving ng-jq blank or setting the name of
	 * the jquery variable under window (eg. jQuery).
	 *
	 * Since angular looks for this directive when it is loaded (doesn't wait for the
	 * DOMContentLoaded event), it must be placed on an element that comes before the script
	 * which loads angular. Also, only the first instance of `ng-jq` will be used and all
	 * others ignored.
	 *
	 * @example
	 * This example shows how to force jqLite using the `ngJq` directive to the `html` tag.
	 ```html
	 <!doctype html>
	 <html ng-app ng-jq>
	 ...
	 ...
	 </html>
	 ```
	 * @example
	 * This example shows how to use a jQuery based library of a different name.
	 * The library name must be available at the top most 'window'.
	 ```html
	 <!doctype html>
	 <html ng-app ng-jq="jQueryLib">
	 ...
	 ...
	 </html>
	 ```
	 */
	exports.jq = function () {
	    if (isDefined(exports.jq.name_))
	        return exports.jq.name_;
	    var el;
	    var i, ii = ngAttrPrefixes.length, prefix, name;
	    for (i = 0; i < ii; ++i) {
	        prefix = ngAttrPrefixes[i];
	        if (el = window.document.querySelector('[' + prefix.replace(':', '\\:') + 'jq]')) {
	            name = el.getAttribute(prefix + 'jq');
	            break;
	        }
	    }
	    return (exports.jq.name_ = name);
	};
	function concat(array1, array2, index) {
	    return array1.concat(slice.call(array2, index));
	}
	exports.concat = concat;
	function sliceArgs(args, startIndex) {
	    return slice.call(args, startIndex || 0);
	}
	exports.sliceArgs = sliceArgs;
	/* jshint -W101 */
	/**
	 * @ngdoc function
	 * @name angular.bind
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Returns a function which calls function `fn` bound to `self` (`self` becomes the `this` for
	 * `fn`). You can supply optional `args` that are prebound to the function. This feature is also
	 * known as [partial application](http://en.wikipedia.org/wiki/Partial_application), as
	 * distinguished from [function currying](http://en.wikipedia.org/wiki/Currying#Contrast_with_partial_function_application).
	 *
	 * @param {Object} self Context which `fn` should be evaluated in.
	 * @param {function()} fn Function to be bound.
	 * @param {...*} args Optional arguments to be prebound to the `fn` function call.
	 * @returns {function()} Function that wraps the `fn` with all the specified bindings.
	 */
	/* jshint +W101 */
	function bind(self, fn) {
	    var curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
	    if (isFunction(fn) && !(fn instanceof RegExp)) {
	        return curryArgs.length
	            ? function () {
	                return arguments.length
	                    ? fn.apply(self, concat(curryArgs, arguments, 0))
	                    : fn.apply(self, curryArgs);
	            }
	            : function () {
	                return arguments.length
	                    ? fn.apply(self, arguments)
	                    : fn.call(self);
	            };
	    }
	    else {
	        // In IE, native methods are not functions so they cannot be bound (note: they don't need to be).
	        return fn;
	    }
	}
	exports.bind = bind;
	function toJsonReplacer(key, value) {
	    var val = value;
	    if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
	        val = undefined;
	    }
	    else if (isWindow(value)) {
	        val = '$WINDOW';
	    }
	    else if (value && window.document === value) {
	        val = '$DOCUMENT';
	    }
	    else if (isScope(value)) {
	        val = '$SCOPE';
	    }
	    return val;
	}
	exports.toJsonReplacer = toJsonReplacer;
	/**
	 * @ngdoc function
	 * @name angular.toJson
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Serializes input into a JSON-formatted string. Properties with leading $$ characters will be
	 * stripped since angular uses this notation internally.
	 *
	 * @param {Object|Array|Date|string|number} obj Input to be serialized into JSON.
	 * @param {boolean|number} [pretty=2] If set to true, the JSON output will contain newlines and whitespace.
	 *    If set to an integer, the JSON output will contain that many spaces per indentation.
	 * @returns {string|undefined} JSON-ified string representing `obj`.
	 * @knownIssue
	 *
	 * The Safari browser throws a `RangeError` instead of returning `null` when it tries to stringify a `Date`
	 * object with an invalid date value. The only reliable way to prevent this is to monkeypatch the
	 * `Date.prototype.toJSON` method as follows:
	 *
	 * ```
	 * var _DatetoJSON = Date.prototype.toJSON;
	 * Date.prototype.toJSON = function() {
	 *   try {
	 *     return _DatetoJSON.call(this);
	 *   } catch(e) {
	 *     if (e instanceof RangeError) {
	 *       return null;
	 *     }
	 *     throw e;
	 *   }
	 * };
	 * ```
	 *
	 * See https://github.com/angular/angular.js/pull/14221 for more information.
	 */
	function toJson(obj, pretty) {
	    if (isUndefined(obj))
	        return undefined;
	    if (!isNumber(pretty)) {
	        pretty = pretty ? 2 : null;
	    }
	    return JSON.stringify(obj, toJsonReplacer, pretty);
	}
	exports.toJson = toJson;
	/**
	 * @ngdoc function
	 * @name angular.fromJson
	 * @module ng
	 * @kind function
	 *
	 * @description
	 * Deserializes a JSON string.
	 *
	 * @param {string} json JSON string to deserialize.
	 * @returns {Object|Array|string|number} Deserialized JSON string.
	 */
	function fromJson(json) {
	    return isString(json)
	        ? JSON.parse(json)
	        : json;
	}
	exports.fromJson = fromJson;
	var ALL_COLONS = /:/g;
	function timezoneToOffset(timezone, fallback) {
	    // IE/Edge do not "understand" colon (`:`) in timezone
	    timezone = timezone.replace(ALL_COLONS, '');
	    var requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
	    return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
	}
	exports.timezoneToOffset = timezoneToOffset;
	function addDateMinutes(date, minutes) {
	    date = new Date(date.getTime());
	    date.setMinutes(date.getMinutes() + minutes);
	    return date;
	}
	exports.addDateMinutes = addDateMinutes;
	function convertTimezoneToLocal(date, timezone, reverse) {
	    reverse = reverse ? -1 : 1;
	    var dateTimezoneOffset = date.getTimezoneOffset();
	    var timezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
	    return addDateMinutes(date, reverse * (timezoneOffset - dateTimezoneOffset));
	}
	exports.convertTimezoneToLocal = convertTimezoneToLocal;
	/**
	 * @returns {string} Returns the string representation of the element.
	 */
	function startingTag(element) {
	    element = jqLite(element).clone();
	    try {
	        // turns out IE does not let you set .html() on elements which
	        // are not allowed to have children. So we just ignore it.
	        element.empty();
	    }
	    catch (e) { }
	    var elemHtml = jqLite('<div>').append(element).html();
	    try {
	        return element[0].nodeType === NODE_TYPE_TEXT ? lowercase(elemHtml) :
	            elemHtml.
	                match(/^(<[^>]+>)/)[1].
	                replace(/^<([\w\-]+)/, function (match, nodeName) { return '<' + lowercase(nodeName); });
	    }
	    catch (e) {
	        return lowercase(elemHtml);
	    }
	}
	exports.startingTag = startingTag;
	/////////////////////////////////////////////////
	/**
	 * Tries to decode the URI component without throwing an exception.
	 *
	 * @private
	 * @param str value potential URI component to check.
	 * @returns {boolean} True if `value` can be decoded
	 * with the decodeURIComponent function.
	 */
	function tryDecodeURIComponent(value) {
	    try {
	        return decodeURIComponent(value);
	    }
	    catch (e) {
	    }
	}
	exports.tryDecodeURIComponent = tryDecodeURIComponent;
	/**
	 * Parses an escaped url query string into key-value pairs.
	 * @returns {Object.<string,boolean|Array>}
	 */
	function parseKeyValue(/**string*/ keyValue) {
	    var obj = {};
	    forEach((keyValue || "").split('&'), function (keyValue) {
	        var splitPoint, key, val;
	        if (keyValue) {
	            key = keyValue = keyValue.replace(/\+/g, '%20');
	            splitPoint = keyValue.indexOf('=');
	            if (splitPoint !== -1) {
	                key = keyValue.substring(0, splitPoint);
	                val = keyValue.substring(splitPoint + 1);
	            }
	            key = tryDecodeURIComponent(key);
	            if (isDefined(key)) {
	                val = isDefined(val) ? tryDecodeURIComponent(val) : true;
	                if (!hasOwnProperty.call(obj, key)) {
	                    obj[key] = val;
	                }
	                else if (exports.isArray(obj[key])) {
	                    obj[key].push(val);
	                }
	                else {
	                    obj[key] = [obj[key], val];
	                }
	            }
	        }
	    });
	    return obj;
	}
	exports.parseKeyValue = parseKeyValue;
	function toKeyValue(obj) {
	    var parts = [];
	    forEach(obj, function (value, key) {
	        if (exports.isArray(value)) {
	            forEach(value, function (arrayValue) {
	                parts.push(encodeUriQuery(key, true) +
	                    (arrayValue === true ? '' : '=' + encodeUriQuery(arrayValue, true)));
	            });
	        }
	        else {
	            parts.push(encodeUriQuery(key, true) +
	                (value === true ? '' : '=' + encodeUriQuery(value, true)));
	        }
	    });
	    return parts.length ? parts.join('&') : '';
	}
	exports.toKeyValue = toKeyValue;
	/**
	 * We need our custom method because encodeURIComponent is too aggressive and doesn't follow
	 * http://www.ietf.org/rfc/rfc3986.txt with regards to the character set (pchar) allowed in path
	 * segments:
	 *    segment       = *pchar
	 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
	 *    pct-encoded   = "%" HEXDIG HEXDIG
	 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
	 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
	 *                     / "*" / "+" / "," / ";" / "="
	 */
	function encodeUriSegment(val) {
	    return encodeUriQuery(val, true).
	        replace(/%26/gi, '&').
	        replace(/%3D/gi, '=').
	        replace(/%2B/gi, '+');
	}
	exports.encodeUriSegment = encodeUriSegment;
	/**
	 * This method is intended for encoding *key* or *value* parts of query component. We need a custom
	 * method because encodeURIComponent is too aggressive and encodes stuff that doesn't have to be
	 * encoded per http://tools.ietf.org/html/rfc3986:
	 *    query         = *( pchar / "/" / "?" )
	 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
	 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
	 *    pct-encoded   = "%" HEXDIG HEXDIG
	 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
	 *                     / "*" / "+" / "," / ";" / "="
	 */
	function encodeUriQuery(val, pctEncodeSpaces) {
	    return encodeURIComponent(val).
	        replace(/%40/gi, '@').
	        replace(/%3A/gi, ':').
	        replace(/%24/g, '$').
	        replace(/%2C/gi, ',').
	        replace(/%3B/gi, ';').
	        replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
	}
	exports.encodeUriQuery = encodeUriQuery;
	var ngAttrPrefixes = ['ng-', 'data-ng-', 'ng:', 'x-ng-'];
	function getNgAttribute(element, ngAttr) {
	    var attr, i, ii = ngAttrPrefixes.length;
	    for (i = 0; i < ii; ++i) {
	        attr = ngAttrPrefixes[i] + ngAttr;
	        if (isString(attr = element.getAttribute(attr))) {
	            return attr;
	        }
	    }
	    return null;
	}
	exports.getNgAttribute = getNgAttribute;
	/**
	 * @ngdoc directive
	 * @name ngApp
	 * @module ng
	 *
	 * @element ANY
	 * @param {angular.Module} ngApp an optional application
	 *   {@link angular.module module} name to load.
	 * @param {boolean=} ngStrictDi if this attribute is present on the app element, the injector will be
	 *   created in "strict-di" mode. This means that the application will fail to invoke functions which
	 *   do not use explicit function annotation (and are thus unsuitable for minification), as described
	 *   in {@link guide/di the Dependency Injection guide}, and useful debugging info will assist in
	 *   tracking down the root of these bugs.
	 *
	 * @description
	 *
	 * Use this directive to **auto-bootstrap** an AngularJS application. The `ngApp` directive
	 * designates the **root element** of the application and is typically placed near the root element
	 * of the page - e.g. on the `<body>` or `<html>` tags.
	 *
	 * There are a few things to keep in mind when using `ngApp`:
	 * - only one AngularJS application can be auto-bootstrapped per HTML document. The first `ngApp`
	 *   found in the document will be used to define the root element to auto-bootstrap as an
	 *   application. To run multiple applications in an HTML document you must manually bootstrap them using
	 *   {@link angular.bootstrap} instead.
	 * - AngularJS applications cannot be nested within each other.
	 * - Do not use a directive that uses {@link ng.$compile#transclusion transclusion} on the same element as `ngApp`.
	 *   This includes directives such as {@link ng.ngIf `ngIf`}, {@link ng.ngInclude `ngInclude`} and
	 *   {@link ngRoute.ngView `ngView`}.
	 *   Doing this misplaces the app {@link ng.$rootElement `$rootElement`} and the app's {@link auto.$injector injector},
	 *   causing animations to stop working and making the injector inaccessible from outside the app.
	 *
	 * You can specify an **AngularJS module** to be used as the root module for the application.  This
	 * module will be loaded into the {@link auto.$injector} when the application is bootstrapped. It
	 * should contain the application code needed or have dependencies on other modules that will
	 * contain the code. See {@link angular.module} for more information.
	 *
	 * In the example below if the `ngApp` directive were not placed on the `html` element then the
	 * document would not be compiled, the `AppController` would not be instantiated and the `{{ a+b }}`
	 * would not be resolved to `3`.
	 *
	 * `ngApp` is the easiest, and most common way to bootstrap an application.
	 *
	 <example module="ngAppDemo">
	   <file name="index.html">
	   <div ng-controller="ngAppDemoController">
	     I can add: {{a}} + {{b}} =  {{ a+b }}
	   </div>
	   </file>
	   <file name="script.js">
	   angular.module('ngAppDemo', []).controller('ngAppDemoController', function($scope) {
	     $scope.a = 1;
	     $scope.b = 2;
	   });
	   </file>
	 </example>
	 *
	 * Using `ngStrictDi`, you would see something like this:
	 *
	 <example ng-app-included="true">
	   <file name="index.html">
	   <div ng-app="ngAppStrictDemo" ng-strict-di>
	       <div ng-controller="GoodController1">
	           I can add: {{a}} + {{b}} =  {{ a+b }}

	           <p>This renders because the controller does not fail to
	              instantiate, by using explicit annotation style (see
	              script.js for details)
	           </p>
	       </div>

	       <div ng-controller="GoodController2">
	           Name: <input ng-model="name"><br />
	           Hello, {{name}}!

	           <p>This renders because the controller does not fail to
	              instantiate, by using explicit annotation style
	              (see script.js for details)
	           </p>
	       </div>

	       <div ng-controller="BadController">
	           I can add: {{a}} + {{b}} =  {{ a+b }}

	           <p>The controller could not be instantiated, due to relying
	              on automatic function annotations (which are disabled in
	              strict mode). As such, the content of this section is not
	              interpolated, and there should be an error in your web console.
	           </p>
	       </div>
	   </div>
	   </file>
	   <file name="script.js">
	   angular.module('ngAppStrictDemo', [])
	     // BadController will fail to instantiate, due to relying on automatic function annotation,
	     // rather than an explicit annotation
	     .controller('BadController', function($scope) {
	       $scope.a = 1;
	       $scope.b = 2;
	     })
	     // Unlike BadController, GoodController1 and GoodController2 will not fail to be instantiated,
	     // due to using explicit annotations using the array style and $inject property, respectively.
	     .controller('GoodController1', ['$scope', function($scope) {
	       $scope.a = 1;
	       $scope.b = 2;
	     }])
	     .controller('GoodController2', GoodController2);
	     function GoodController2($scope) {
	       $scope.name = "World";
	     }
	     GoodController2.$inject = ['$scope'];
	   </file>
	   <file name="style.css">
	   div[ng-controller] {
	       margin-bottom: 1em;
	       -webkit-border-radius: 4px;
	       border-radius: 4px;
	       border: 1px solid;
	       padding: .5em;
	   }
	   div[ng-controller^=Good] {
	       border-color: #d6e9c6;
	       background-color: #dff0d8;
	       color: #3c763d;
	   }
	   div[ng-controller^=Bad] {
	       border-color: #ebccd1;
	       background-color: #f2dede;
	       color: #a94442;
	       margin-bottom: 0;
	   }
	   </file>
	 </example>
	 */
	function angularInit(element, bootstrap) {
	    var appElement, module, config = {};
	    // The element `element` has priority over any other element.
	    forEach(ngAttrPrefixes, function (prefix) {
	        var name = prefix + 'app';
	        if (!appElement && element.hasAttribute && element.hasAttribute(name)) {
	            appElement = element;
	            module = element.getAttribute(name);
	        }
	    });
	    forEach(ngAttrPrefixes, function (prefix) {
	        var name = prefix + 'app';
	        var candidate;
	        if (!appElement && (candidate = element.querySelector('[' + name.replace(':', '\\:') + ']'))) {
	            appElement = candidate;
	            module = candidate.getAttribute(name);
	        }
	    });
	    if (appElement) {
	        config.strictDi = getNgAttribute(appElement, "strict-di") !== null;
	        bootstrap(appElement, module ? [module] : [], config);
	    }
	}
	exports.angularInit = angularInit;
	/**
	 * @ngdoc function
	 * @name angular.bootstrap
	 * @module ng
	 * @description
	 * Use this function to manually start up angular application.
	 *
	 * For more information, see the {@link guide/bootstrap Bootstrap guide}.
	 *
	 * Angular will detect if it has been loaded into the browser more than once and only allow the
	 * first loaded script to be bootstrapped and will report a warning to the browser console for
	 * each of the subsequent scripts. This prevents strange results in applications, where otherwise
	 * multiple instances of Angular try to work on the DOM.
	 *
	 * <div class="alert alert-warning">
	 * **Note:** Protractor based end-to-end tests cannot use this function to bootstrap manually.
	 * They must use {@link ng.directive:ngApp ngApp}.
	 * </div>
	 *
	 * <div class="alert alert-warning">
	 * **Note:** Do not bootstrap the app on an element with a directive that uses {@link ng.$compile#transclusion transclusion},
	 * such as {@link ng.ngIf `ngIf`}, {@link ng.ngInclude `ngInclude`} and {@link ngRoute.ngView `ngView`}.
	 * Doing this misplaces the app {@link ng.$rootElement `$rootElement`} and the app's {@link auto.$injector injector},
	 * causing animations to stop working and making the injector inaccessible from outside the app.
	 * </div>
	 *
	 * ```html
	 * <!doctype html>
	 * <html>
	 * <body>
	 * <div ng-controller="WelcomeController">
	 *   {{greeting}}
	 * </div>
	 *
	 * <script src="angular.js"></script>
	 * <script>
	 *   var app = angular.module('demo', [])
	 *   .controller('WelcomeController', function($scope) {
	 *       $scope.greeting = 'Welcome!';
	 *   });
	 *   angular.bootstrap(document, ['demo']);
	 * </script>
	 * </body>
	 * </html>
	 * ```
	 *
	 * @param {DOMElement} element DOM element which is the root of angular application.
	 * @param {Array<String|Function|Array>=} modules an array of modules to load into the application.
	 *     Each item in the array should be the name of a predefined module or a (DI annotated)
	 *     function that will be invoked by the injector as a `config` block.
	 *     See: {@link angular.module modules}
	 * @param {Object=} config an object for defining configuration options for the application. The
	 *     following keys are supported:
	 *
	 * * `strictDi` - disable automatic function annotation for the application. This is meant to
	 *   assist in finding bugs which break minified code. Defaults to `false`.
	 *
	 * @returns {auto.$injector} Returns the newly created injector for this app.
	 */
	function bootstrap(element, modules, config) {
	    if (!isObject(config))
	        config = {};
	    var defaultConfig = {
	        strictDi: false
	    };
	    config = extend(defaultConfig, config);
	    var doBootstrap = function () {
	        element = jqLite(element);
	        if (element.injector()) {
	            var tag = (element[0] === window.document) ? 'document' : startingTag(element);
	            // Encode angle brackets to prevent input from being sanitized to empty string #8683.
	            throw ngMinErr('btstrpd', "App already bootstrapped with this element '{0}'", tag.replace(/</, '&lt;').replace(/>/, '&gt;'));
	        }
	        modules = modules || [];
	        modules.unshift(['$provide', function ($provide) {
	                $provide.value('$rootElement', element);
	            }]);
	        if (config.debugInfoEnabled) {
	            // Pushing so that this overrides `debugInfoEnabled` setting defined in user's `modules`.
	            modules.push(['$compileProvider', function ($compileProvider) {
	                    $compileProvider.debugInfoEnabled(true);
	                }]);
	        }
	        modules.unshift('ng');
	        var injector = createInjector(modules, config.strictDi);
	        injector.invoke(['$rootScope', '$rootElement', '$compile', '$injector',
	            function bootstrapApply(scope, element, compile, injector) {
	                scope.$apply(function () {
	                    element.data('$injector', injector);
	                    compile(element)(scope);
	                });
	            }]);
	        return injector;
	    };
	    var NG_ENABLE_DEBUG_INFO = /^NG_ENABLE_DEBUG_INFO!/;
	    var NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;
	    if (window && NG_ENABLE_DEBUG_INFO.test(window.name)) {
	        config.debugInfoEnabled = true;
	        window.name = window.name.replace(NG_ENABLE_DEBUG_INFO, '');
	    }
	    if (window && !NG_DEFER_BOOTSTRAP.test(window.name)) {
	        return doBootstrap();
	    }
	    window.name = window.name.replace(NG_DEFER_BOOTSTRAP, '');
	    angular.resumeBootstrap = function (extraModules) {
	        forEach(extraModules, function (module) {
	            modules.push(module);
	        });
	        return doBootstrap();
	    };
	    if (isFunction(angular.resumeDeferredBootstrap)) {
	        angular.resumeDeferredBootstrap();
	    }
	}
	exports.bootstrap = bootstrap;
	/**
	 * @ngdoc function
	 * @name angular.reloadWithDebugInfo
	 * @module ng
	 * @description
	 * Use this function to reload the current application with debug information turned on.
	 * This takes precedence over a call to `$compileProvider.debugInfoEnabled(false)`.
	 *
	 * See {@link ng.$compileProvider#debugInfoEnabled} for more.
	 */
	function reloadWithDebugInfo() {
	    window.name = 'NG_ENABLE_DEBUG_INFO!' + window.name;
	    window.location.reload();
	}
	exports.reloadWithDebugInfo = reloadWithDebugInfo;
	/**
	 * @name angular.getTestability
	 * @module ng
	 * @description
	 * Get the testability service for the instance of Angular on the given
	 * element.
	 * @param {DOMElement} element DOM element which is the root of angular application.
	 */
	function getTestability(rootElement) {
	    var injector = angular.element(rootElement).injector();
	    if (!injector) {
	        throw ngMinErr('test', 'no injector found for element argument to getTestability');
	    }
	    return injector.get('$$testability');
	}
	exports.getTestability = getTestability;
	var SNAKE_CASE_REGEXP = /[A-Z]/g;
	function snake_case(name, separator) {
	    separator = separator || '_';
	    return name.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
	        return (pos ? separator : '') + letter.toLowerCase();
	    });
	}
	exports.snake_case = snake_case;
	var bindJQueryFired = false;
	function bindJQuery() {
	    var originalCleanData;
	    if (bindJQueryFired) {
	        return;
	    }
	    // bind to jQuery if present;
	    var jqName = exports.jq();
	    jQuery = isUndefined(jqName) ? window.jQuery :
	        !jqName ? undefined :
	            window[jqName]; // use jQuery specified by `ngJq`
	    // Use jQuery if it exists with proper functionality, otherwise default to us.
	    // Angular 1.2+ requires jQuery 1.7+ for on()/off() support.
	    // Angular 1.3+ technically requires at least jQuery 2.1+ but it may work with older
	    // versions. It will not work for sure with jQuery <1.7, though.
	    if (jQuery && jQuery.fn.on) {
	        jqLite = jQuery;
	        extend(jQuery.fn, {
	            scope: JQLitePrototype.scope,
	            isolateScope: JQLitePrototype.isolateScope,
	            controller: JQLitePrototype.controller,
	            injector: JQLitePrototype.injector,
	            inheritedData: JQLitePrototype.inheritedData
	        });
	        // All nodes removed from the DOM via various jQuery APIs like .remove()
	        // are passed through jQuery.cleanData. Monkey-patch this method to fire
	        // the $destroy event on all removed nodes.
	        originalCleanData = jQuery.cleanData;
	        jQuery.cleanData = function (elems) {
	            var events;
	            for (var i = 0, elem; (elem = elems[i]) != null; i++) {
	                events = jQuery._data(elem, "events");
	                if (events && events.$destroy) {
	                    jQuery(elem).triggerHandler('$destroy');
	                }
	            }
	            originalCleanData(elems);
	        };
	    }
	    else {
	        jqLite = JQLite;
	    }
	    angular.element = jqLite;
	    // Prevent double-proxying.
	    bindJQueryFired = true;
	}
	exports.bindJQuery = bindJQuery;
	/**
	 * throw error if the argument is falsy.
	 */
	function assertArg(arg, name, reason) {
	    if (!arg) {
	        throw ngMinErr('areq', "Argument '{0}' is {1}", (name || '?'), (reason || "required"));
	    }
	    return arg;
	}
	exports.assertArg = assertArg;
	function assertArgFn(arg, name, acceptArrayAnnotation) {
	    if (acceptArrayAnnotation && exports.isArray(arg)) {
	        arg = arg[arg.length - 1];
	    }
	    assertArg(isFunction(arg), name, 'not a function, got ' +
	        (arg && typeof arg === 'object' ? arg.constructor.name || 'Object' : typeof arg));
	    return arg;
	}
	exports.assertArgFn = assertArgFn;
	/**
	 * throw error if the name given is hasOwnProperty
	 * @param  {String} name    the name to test
	 * @param  {String} context the context in which the name is used, such as module or directive
	 */
	function assertNotHasOwnProperty(name, context) {
	    if (name === 'hasOwnProperty') {
	        throw ngMinErr('badname', "hasOwnProperty is not a valid {0} name", context);
	    }
	}
	exports.assertNotHasOwnProperty = assertNotHasOwnProperty;
	/**
	 * Return the value accessible from the object by path. Any undefined traversals are ignored
	 * @param {Object} obj starting object
	 * @param {String} path path to traverse
	 * @param {boolean} [bindFnToScope=true]
	 * @returns {Object} value as accessible by path
	 */
	//TODO(misko): this function needs to be removed
	function getter(obj, path, bindFnToScope) {
	    if (!path)
	        return obj;
	    var keys = path.split('.');
	    var key;
	    var lastInstance = obj;
	    var len = keys.length;
	    for (var i = 0; i < len; i++) {
	        key = keys[i];
	        if (obj) {
	            obj = (lastInstance = obj)[key];
	        }
	    }
	    if (!bindFnToScope && isFunction(obj)) {
	        return bind(lastInstance, obj);
	    }
	    return obj;
	}
	exports.getter = getter;
	/**
	 * Return the DOM siblings between the first and last node in the given array.
	 * @param {Array} array like object
	 * @returns {Array} the inputted object or a jqLite collection containing the nodes
	 */
	function getBlockNodes(nodes) {
	    // TODO(perf): update `nodes` instead of creating a new object?
	    var node = nodes[0];
	    var endNode = nodes[nodes.length - 1];
	    var blockNodes;
	    for (var i = 1; node !== endNode && (node = node.nextSibling); i++) {
	        if (blockNodes || nodes[i] !== node) {
	            if (!blockNodes) {
	                blockNodes = jqLite(slice.call(nodes, 0, i));
	            }
	            blockNodes.push(node);
	        }
	    }
	    return blockNodes || nodes;
	}
	exports.getBlockNodes = getBlockNodes;
	/**
	 * Creates a new object without a prototype. This object is useful for lookup without having to
	 * guard against prototypically inherited properties via hasOwnProperty.
	 *
	 * Related micro-benchmarks:
	 * - http://jsperf.com/object-create2
	 * - http://jsperf.com/proto-map-lookup/2
	 * - http://jsperf.com/for-in-vs-object-keys2
	 *
	 * @returns {Object}
	 */
	function createMap() {
	    return Object.create(null);
	}
	exports.createMap = createMap;
	function stringify(value) {
	    if (value == null) {
	        return '';
	    }
	    switch (typeof value) {
	        case 'string':
	            break;
	        case 'number':
	            value = '' + value;
	            break;
	        default:
	            if (hasCustomToString(value) && !exports.isArray(value) && !isDate(value)) {
	                value = value.toString();
	            }
	            else {
	                value = toJson(value);
	            }
	    }
	    return value;
	}
	exports.stringify = stringify;
	var NODE_TYPE_ELEMENT = 1;
	var NODE_TYPE_ATTRIBUTE = 2;
	var NODE_TYPE_TEXT = 3;
	var NODE_TYPE_COMMENT = 8;
	var NODE_TYPE_DOCUMENT = 9;
	var NODE_TYPE_DOCUMENT_FRAGMENT = 11;
	function serializeObject(obj) {
	    var seen = [];
	    return JSON.stringify(obj, function (key, val) {
	        val = toJsonReplacer(key, val);
	        if (isObject(val)) {
	            if (seen.indexOf(val) >= 0)
	                return '...';
	            seen.push(val);
	        }
	        return val;
	    });
	}
	exports.serializeObject = serializeObject;
	function toDebugString(obj) {
	    if (typeof obj === 'function') {
	        return obj.toString().replace(/ \{[\s\S]*$/, '');
	    }
	    else if (isUndefined(obj)) {
	        return 'undefined';
	    }
	    else if (typeof obj !== 'string') {
	        return serializeObject(obj);
	    }
	    return obj;
	}
	exports.toDebugString = toDebugString;


/***/ }
/******/ ]);