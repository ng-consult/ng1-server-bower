/// <reference path="../typings/globals/angular/index.d.ts" />

import HttpInterceptorQueue from './factory/httpInterceptorQueue';
import Log from './decorator/log';
import ExceptionHandler from './decorator/exceptionHandler';
import EngineQueue from './factory/engineQueue';
import Q from './decorator/q2';
import CounterFactory from './factory/Counter';
import TimeoutValueProvider from './provider/timeoutValue';
import {CacheFactory, TemplateCache, CacheFactoryConfig} from './decorator/cacheFactory';

angular.module('server', [])
    .provider('timeoutValue', TimeoutValueProvider)
    .factory('counter', ['$rootScope', '$log', 'engineQueue', 'timeoutValue', CounterFactory])
    .factory('engineQueue', ['$log', '$rootScope', '$window', EngineQueue])
    .factory('httpInterceptorQueue', ['$q', '$log', 'counter', HttpInterceptorQueue])
    .decorator('$q', ['$delegate', 'counter', Q])
    .decorator('$exceptionHandler', ['$delegate', '$window', ExceptionHandler])
    .decorator('$log', ['$delegate', '$window', Log])
    .decorator('$cacheFactory', ['$delegate', CacheFactory])
    .decorator('$templateCache', ['$cacheFactory', TemplateCache])
    .provider('cacheFactoryConfig', CacheFactoryConfig)
    .config(function ($httpProvider) {

        $httpProvider.interceptors.push('httpInterceptorQueue');

    })
    .run(function ($rootScope, $log, $window, $timeout, $http, $cacheFactory, cacheFactoryConfig, timeoutValue, counter) {

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

        var digestWatcher = $rootScope.$watch(() => {
            counter.incr('digest');
            $rootScope.$$postDigest(function () {
                counter.decr('digest');
            });
        });

        $rootScope.$apply(() => {
            //run a dummy digest
            $timeout(() => {
                $log.dev('index.ts', 'touching http and q');
                $log.dev('index.ts', 'getting http count', counter.getCount('http'), httpCouter.getCount());
                //$log.dev('index.ts', 'getting httpCcounter', counter.get('http'), counter.get('http').getCount());

                $log.dev('index.ts', 'getting q count', counter.getCount('q'), qCounter.getCount());
                //$log.dev('index.ts', 'getting httpCOunter', counter.get('q'), counter.get('q').getCount());
                httpCouter.touch();
                qCounter.touch();
            }, timeoutValue.get());
        });


        // REST CACHE SECTION
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

