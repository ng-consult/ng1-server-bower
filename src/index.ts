/// <reference path="../typings/globals/angular/index.d.ts" />

import  HttpInterceptorQueue from './factory/httpInterceptorQueue';
import Log from './decorator/log';
import ExceptionHandler from './decorator/exceptionHandler';
import EngineQueue from './factory/engineQueue';
import Q from './decorator/q2';
import CounterFactory from './service/Counter';

angular.module('server', [])
    .constant('TimeoutValue', 500)
    .config(function($provide, $httpProvider, $windowProvider) {

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
    })
    .run(function($rootScope, $q, $http, $log, counter) {

        counter.create('digest', ()=>{
            //$log.dev('run', 'digestWatcher cleanup', digestWatcher);
            digestWatcher();
        });

        var digestWatcher = $rootScope.$watch(() => {
            counter.incr('digest');
            $rootScope.$$postDigest(function() {
                counter.decr('digest');
            });
        });

        //run a dummy digest
        $rootScope.$apply(function() {var i =0;});
        //run a dummy promise
        $q(function(resolve, reject) {resolve(true);}).then(function(res) {});
        //run  dummy $http request - breaks test
        $http.get('/someInexistantValue', {config: {timeout: 10}}).then(function(){
            //$log.dev('run', 'should not be displayed');
        }, function(err) {
            //$log.dev('run', 'should be thrown timeout error here', err);
        });

    });
