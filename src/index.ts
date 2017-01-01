import {IServerConfig, ICounterFactory} from './interfaces/definitions';
import HttpInterceptorQueue from './factory/httpInterceptorQueue';
import Log from './decorator/log';
import EngineQueue from './factory/engineQueue';
import Q from './decorator/q2';
import CounterFactory from './factory/Counter';
import {CacheFactory, TemplateCache} from './decorator/cacheFactory';
import ServerConfigFactory from './factory/serverConfig';
import SocketFactory from './factory/Socket';
import ExceptionHandler from './decorator/exceptionHandler';
import TemplateRequest from './decorator/templateRequest';
import WindowError from './factory/windowError';


angular.module('server', [])

    .factory('serverConfigHelper', [ '$window', ServerConfigFactory])
    .factory('counter', ['$rootScope', '$log', 'engineQueue', 'serverConfigHelper', CounterFactory])
    .factory('engineQueue', ['$log', '$rootScope', '$window', '$cacheFactory', 'socket', 'serverConfigHelper', EngineQueue])
    .factory('socket', ['$window', 'serverConfigHelper', SocketFactory])
    .factory('httpInterceptorQueue', ['$q', '$log', 'engineQueue', 'serverConfigHelper', 'counter', HttpInterceptorQueue])
    .factory('windowError', ['$rootScope', '$window', 'serverConfigHelper', WindowError])

    .decorator('$exceptionHandler', ['$delegate', '$log', '$window', ExceptionHandler])
    .decorator('$q', ['$delegate', 'counter', Q])
    .decorator('$log', ['$delegate', 'socket', 'serverConfigHelper', Log])
    .decorator('$cacheFactory', ['$delegate', CacheFactory])
    .decorator('$templateCache', ['$cacheFactory', TemplateCache])
    .decorator('$templateRequest', ['$delegate', '$sce', 'serverConfigHelper', TemplateRequest])

    .config( ($httpProvider) => {
        $httpProvider.interceptors.push('httpInterceptorQueue');
    })

    .run( ($rootScope, socket, $log, $timeout, $http, $cacheFactory, windowError, serverConfigHelper: IServerConfig, counter: ICounterFactory) => {

        windowError.init();
        serverConfigHelper.init();

        if(serverConfigHelper.hasRestCache()) {
            $cacheFactory.importAll(serverConfigHelper.getRestCache());
            $http.defaults.cache = true;
        }

        if (serverConfigHelper.onServer() == true) {
            $http.defaults.cache = true;
            socket.init();
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

        }, serverConfigHelper.getTimeoutValue());

        var digestWatcher = $rootScope.$watch(() => {
            counter.incr('digest');
            $rootScope.$$postDigest(function () {
                counter.decr('digest');
            });
        });


        $rootScope.$on('InternIdle', function() {
            if (serverConfigHelper.hasRestCache() && serverConfigHelper.getDefaultHttpCache() === false) {
                $http.defaults.cache = false;
            }
            if(serverConfigHelper.hasPreBoot()) {
                console.log('PREBOOT EXECUTED');
                serverConfigHelper.preBootComplete();
            }
        });



    });

