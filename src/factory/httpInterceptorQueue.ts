'use strict';
import {IEngineQueue, IServerConfig} from './../interfaces/definitions';

const HttpInterceptorQueue = ($q, $log, engineQueue: IEngineQueue, serverConfig: IServerConfig, counter) => {

    $log.dev('HttpInterceptor', 'instanciated', this);

    const hCounter = counter.create('http');

    const cacheMapping = {};

    return {
        request:  (config) => {
            $log.dev('httpRequest', config.url);
            hCounter.incr();

            const restURL = serverConfig.getRestServer();

            if ( serverConfig.onServer() ) {
                if(config.url.indexOf( restURL ) === -1) {
                    config.headers['NgReferer'] = window.location.href;
                    config.url = restURL
                        + '/get?url='
                        + encodeURIComponent(config.url);
                }
            }
            else {
                if(restURL !== null ) {
                    //console.log('REST URL IS NOT NULL');
                    if(config.url.indexOf(restURL) === -1) {
                        config.headers['NgReferer'] = window.location.href;
                        config.url = restURL
                            + '/get?url='
                            + encodeURIComponent(config.url);
                    }
                }
            }

            if( angular.isDefined(window['onServer']) && window['onServer'] === true && window['ngIdle'] === false) {
                if(config.cache) {
                    const cacheName = config.cache.info();
                    cacheMapping[config.url] = cacheName.id;
                } else {
                    cacheMapping[config.url] = '$http'; //default ng name
                }
            }

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