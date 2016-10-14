'use strict';

const HttpInterceptorQueue = ($q, $log, engineQueue, counter) => {

    $log.dev('HttpInterceptor', 'instanciated', this);

    const hCounter = counter.create('http');

    const cacheMapping = {};

    return {
        request:  (config) => {
            $log.dev('httpRequest', config.url);
            hCounter.incr();

            if (window['onServer'] && typeof window['serverConfig']['cacheServer'] !== 'undefined') {
                if(config.url.indexOf(window['serverConfig']['cacheServer']) === -1) {
                    config.url = window['serverConfig']['cacheServer']
                        + '/get?url='
                        + encodeURIComponent(config.url)
                        + '&original-url='
                        + encodeURIComponent(window.location.href );
                }

            } else {
                //todo remove for test only
                if(config.url.indexOf('http://127.0.0.1:8883/get?url=') === -1) {
                    config.url = 'http://127.0.0.1:8883/get?url='
                        + encodeURIComponent(config.url)
                        + '&original-url='
                        + encodeURIComponent(window.location.href );
                }
            }
            if( window['ngIdle'] === false) {
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
            //Todo : REst caching

            /*

            1 - rest server returns the request
            2 - rest server augment the response.config
            response.config = {
                cached: true/false,
                urlKEY: instance:domain
                url hashKey: url
            }
            3 - Store this information into engineQueue as a dependency
            4 - onIDLE, engine queue sends the dependency list with HTML
            5 - CC1 generates the HTML and includes the dependencies inline for fast loading

             */
            
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