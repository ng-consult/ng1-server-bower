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

    .factory('serverConfig', [ '$window', ServerConfigFactory])
    .factory('counter', ['$rootScope', '$log', 'engineQueue', 'serverConfig', CounterFactory])
    .factory('engineQueue', ['$log', '$rootScope', '$window', '$cacheFactory', 'socket', 'serverConfig', EngineQueue])
    .factory('socket', ['$window', 'serverConfig', SocketFactory])
    .factory('httpInterceptorQueue', ['$q', '$log', 'engineQueue', 'serverConfig', 'counter', HttpInterceptorQueue])
    .factory('windowError', ['$rootScope', '$window', 'serverConfig', WindowError])

    .decorator('$exceptionHandler', ['$delegate', '$log', '$window', ExceptionHandler])
    .decorator('$q', ['$delegate', 'counter', Q])
    .decorator('$log', ['$delegate', 'socket', 'serverConfig', Log])
    .decorator('$cacheFactory', ['$delegate', CacheFactory])
    .decorator('$templateCache', ['$cacheFactory', TemplateCache])
    .decorator('$templateRequest', ['$delegate', '$sce', 'serverConfig', TemplateRequest])

    .config( ($httpProvider) => {
        $httpProvider.interceptors.push('httpInterceptorQueue');
    })

    .run( ($rootScope, socket, $log, $timeout, $http, $cacheFactory, windowError, serverConfig: IServerConfig, counter: ICounterFactory) => {

        windowError.init();
        serverConfig.init();

        if(serverConfig.hasRestCache()) {
            $cacheFactory.importAll(serverConfig.getRestCache());
            $http.defaults.cache = true;
        }

        if (serverConfig.onServer() == true) {
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

        }, serverConfig.getTimeoutValue());

        var digestWatcher = $rootScope.$watch(() => {
            counter.incr('digest');
            $rootScope.$$postDigest(function () {
                counter.decr('digest');
            });
        });


        if (serverConfig.hasRestCache() && serverConfig.getDefaultHttpCache() === false) {
            $rootScope.$on('InternIdle', function() {
                $http.defaults.cache = false;
            });
        };

    });

