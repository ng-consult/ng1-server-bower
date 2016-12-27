'use strict';
import {IEngineQueue, IServerConfig} from './../interfaces/definitions';

const HttpInterceptorQueue = ($q, $log, engineQueue: IEngineQueue, serverConfig: IServerConfig, counter) => {

    $log.dev('HttpInterceptor', 'instanciated', this);

    const hCounter = counter.create('http');

    const cacheMapping = {};

    return {
        request:  (config) => {
            $log.dev('before decorator -> httpRequest', config.url);
            hCounter.incr();
            const restURL = serverConfig.getRestServer();

            if(restURL !== null && config.url.indexOf(restURL) === -1) {
                //config.headers['NgReferer'] = window.location.href;
                if(serverConfig.onServer() || serverConfig.getRestCacheEnabled()) {
                    config.url = restURL
                        + '/get?url='
                        + encodeURIComponent(config.url);
                }
            }

            if( serverConfig.onServer() && window['ngIdle'] === false) {
                if(config.cache) {
                    const cacheName = config.cache.info();
                    cacheMapping[config.url] = cacheName.id; //this should be $http anyway - or templates
                } else {
                    cacheMapping[config.url] = '$http'; //default ng name
                }
            }

            $log.dev('after decorator -> httpRequest', config.url);
            $log.dev('cacheMapping = ', cacheMapping);

            return $q.when(config);
        },
        requestError: (rejection) => {
            hCounter.decr();
            //todo remove from cacheMapping
            return $q.reject(rejection);
        },
        response:  (response) =>{

            if (response.headers('ngservercached') === 'yes' && window['ngIdle'] === false) {
                engineQueue.addDependency(response.config.url, cacheMapping[response.config.url]);
            }

            $log.dev('httpResponse', response.config.url);
            hCounter.decr();
            return $q.when(response);
        },
        responseError: (response) => {
            $log.dev('httpResponse', response.config.url);
            hCounter.decr();
            return $q.reject(response);
        }
    };
};

export default HttpInterceptorQueue;