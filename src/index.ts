/// <reference path="../typings/globals/angular/index.d.ts" />

import HttpInterceptorQueue from './factory/httpInterceptorQueue';
import Log from './decorator/log';
import EngineQueue from './factory/engineQueue';
import Q from './decorator/q2';
import CounterFactory from './factory/Counter';
import TimeoutValueProvider from './provider/timeoutValue';
import {CacheFactory, TemplateCache, CacheFactoryConfig} from './decorator/cacheFactory';
import SocketFactory from './factory/Socket';
import ExceptionHandler from './decorator/exceptionHandler';

angular.module('server', [])
    .provider('timeoutValue', TimeoutValueProvider)

    .decorator('$exceptionHandler', ['$delegate', '$log', '$window', ExceptionHandler])

    .factory('counter', ['$rootScope', '$log', 'engineQueue', 'timeoutValue', CounterFactory])
    .factory('engineQueue', ['$log', '$rootScope', '$window', 'socket', EngineQueue])
    .factory('socket', [SocketFactory])
    .factory('httpInterceptorQueue', ['$q', '$log', 'counter', HttpInterceptorQueue])

    .decorator('$q', ['$delegate', 'counter', Q])
    .decorator('$log', ['$delegate', 'socket', '$window', Log])
    .decorator('$cacheFactory', ['$delegate', CacheFactory])
    .decorator('$templateCache', ['$cacheFactory', TemplateCache])

    .provider('cacheFactoryConfig', CacheFactoryConfig)
    .config( ($httpProvider) => {
        $httpProvider.interceptors.push('httpInterceptorQueue');
    })
    .run( ($rootScope, socket, $log, $exceptionHandler, $window, $timeout, $http, $cacheFactory, cacheFactoryConfig, timeoutValue, counter) => {

        const originalThrow = $window.throw;

        let originalErrorHandler = $window.onerror;
        if ( ! originalErrorHandler ) {
            originalErrorHandler = function mockHandler() {
                return( true );
            };
        }


        $window.onerror = function handleGlobalError( message, fileName, lineNumber, columnNumber, error ) {
            // If this browser does not pass-in the original error object, let's
            // create a new error object based on what we know.
            if ( ! error ) {
                error = new Error( message );
                // NOTE: These values are not standard, according to MDN.
                error.fileName = fileName;
                error.lineNumber = lineNumber;
                error.columnNumber = ( columnNumber || 0 );
            }
            $rootScope.exception = true;
            // Pass the error off to our core error handler.
            //$exceptionHandler( error );
            // Pass of the error to the original error handler.

            return false;
            return originalErrorHandler.apply( $window, arguments ) ;

        };
        
        if ($window.onServer == true) {
            if (typeof $window['io'] !== 'undefined') {
                socket.connect($window.serverConfig.socketHostname);
            } else {
                const script = document.createElement('script');
                $window.document.head.appendChild(script);
                script.onload = () => {
                    console.log('IO SCRIPT LOADED', JSON.stringify('http://' + $window.serverConfig.socketHostname + '/socket.io/socket.io.js'));
                    if(typeof $window['io'] === 'undefined') {
                        throw new Error('It seems IO didnt load inside ngApp');
                    }
                    socket.connect($window.serverConfig.socketHostname);
                };
                script.src = 'http://' + $window.serverConfig.socketHostname + '/socket.io/socket.io.js';

            }
        }

        // IDLE EVENT SETION
        if (typeof $window.clientTimeoutValue === 'number') {
            timeoutValue.set($window.clientTimeoutValue);
        } else {
            timeoutValue.set(200);
        }

        const httpCouter = counter.create('http');
        const qCounter = counter.create('q');
        const digestCounter = counter.create('digest', ()=> {
            $log.dev('run', 'digestWatcher cleanup', digestWatcher);
            digestWatcher();
        });


        $timeout(function () {
            $rootScope.$apply(() => {
                $log.dev('index.ts', 'touching http and q');
                httpCouter.touch();
                qCounter.touch();
            });

        }, timeoutValue.get());


        var digestWatcher = $rootScope.$watch(() => {
            counter.incr('digest');
            $rootScope.$$postDigest(function () {
                counter.decr('digest');
            });
        });

        // REST CACHE SECTION
        $http.defaults.cache = true;

        //throw new Error('test');


    });

