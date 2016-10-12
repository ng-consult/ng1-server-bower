"use strict";
var httpInterceptorQueue_1 = require('./factory/httpInterceptorQueue');
var log_1 = require('./decorator/log');
var engineQueue_1 = require('./factory/engineQueue');
var q2_1 = require('./decorator/q2');
var Counter_1 = require('./factory/Counter');
var timeoutValue_1 = require('./provider/timeoutValue');
var cacheFactory_1 = require('./decorator/cacheFactory');
var Socket_1 = require('./factory/Socket');
var exceptionHandler_1 = require('./decorator/exceptionHandler');
angular.module('server', [])
    .provider('timeoutValue', timeoutValue_1.default)
    .decorator('$exceptionHandler', ['$delegate', '$log', '$window', exceptionHandler_1.default])
    .factory('counter', ['$rootScope', '$log', 'engineQueue', 'timeoutValue', Counter_1.default])
    .factory('engineQueue', ['$log', '$rootScope', '$window', 'socket', engineQueue_1.default])
    .factory('socket', [Socket_1.default])
    .factory('httpInterceptorQueue', ['$q', '$log', 'counter', httpInterceptorQueue_1.default])
    .decorator('$q', ['$delegate', 'counter', q2_1.default])
    .decorator('$log', ['$delegate', 'socket', '$window', log_1.default])
    .decorator('$cacheFactory', ['$delegate', cacheFactory_1.CacheFactory])
    .decorator('$templateCache', ['$cacheFactory', cacheFactory_1.TemplateCache])
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
        return originalErrorHandler.apply($window, arguments);
    };
    if ($window.onServer == true) {
        if (typeof $window['io'] !== 'undefined') {
            socket.connect($window.serverConfig.socketHostname);
        }
        else {
            var script = document.createElement('script');
            $window.document.head.appendChild(script);
            script.onload = function () {
                console.log('IO SCRIPT LOADED', JSON.stringify('http://' + $window.serverConfig.socketHostname + '/socket.io/socket.io.js'));
                if (typeof $window['io'] === 'undefined') {
                    throw new Error('It seems IO didnt load inside ngApp');
                }
                socket.connect($window.serverConfig.socketHostname);
            };
            script.src = 'http://' + $window.serverConfig.socketHostname + '/socket.io/socket.io.js';
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
    throw new Error('test');
});
