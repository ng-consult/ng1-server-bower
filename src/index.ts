/// <reference path="../typings/globals/angular/index.d.ts" />

import HttpInterceptorQueue from './factory/httpInterceptorQueue';
import Log from './decorator/log';
import ExceptionHandler from './decorator/exceptionHandler';
import EngineQueue from './factory/engineQueue';
import Q from './decorator/q2';
import CounterFactory from './factory/Counter';

var serverModule = angular.module('server', [])
    .constant('TimeoutValue', 200)
    .config(function($provide, $injector, $httpProvider, $windowProvider) {

        var $window = $windowProvider.$get();

        if(typeof $window.onServer !== 'undefined' && $window.onServer === true) {

            $provide.factory('counter', CounterFactory);

            $provide.factory('engineQueue', EngineQueue);

            $provide.decorator('$q', Q);

            $provide.decorator('$exceptionHandler',  ExceptionHandler);

            $provide.decorator('$log',Log);

            $provide.factory('httpInterceptorQueue', HttpInterceptorQueue);
            $httpProvider.interceptors.push('httpInterceptorQueue');
        }

    }).run(function($rootScope, $injector, $http, $log, $window, $timeout, TimeoutValue) {

        if(typeof $window.onServer !== 'undefined' && $window.onServer === true) {

            var counter = $injector.get('counter');

            counter.create('digest', ()=>{
                $log.dev('run', 'digestWatcher cleanup', digestWatcher);
                digestWatcher();
            });

            var digestWatcher = $rootScope.$watch(() => {
                counter.incr('digest');
                $rootScope.$$postDigest(function() {
                    counter.decr('digest');
                });
            });

            //run a dummy digest
            $rootScope.$apply(function() {
                $timeout(function() {
                    $log.dev('index.ts', 'touching');
                    counter.touch('http');
                    counter.touch('q');
                }, TimeoutValue);
            });
            //run a dummy promise
            //$q(function(resolve, reject) {resolve(true);}).then(function(res) {});
            //run  dummy $http request - breaks test
            //$http({method: 'GET', url: '/someInexistantValue', timeout: 10});
        }

    });

