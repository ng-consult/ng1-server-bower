'use strict';
var _this = this;
var HttpInterceptorQueue = function ($q, $log, engineQueue, counter) {
    $log.dev('HttpInterceptor', 'instanciated', _this);
    var hCounter = counter.create('http');
    var cacheMapping = {};
    return {
        request: function (config) {
            $log.dev('httpRequest', config.url);
            hCounter.incr();
            if (window['onServer'] && typeof window['serverConfig']['cacheServer'] !== 'undefined') {
                if (config.url.indexOf(window['serverConfig']['cacheServer']) === -1) {
                    config.url = window['serverConfig']['cacheServer']
                        + '/get?url='
                        + encodeURIComponent(config.url)
                        + '&original-url='
                        + encodeURIComponent(window.location.href);
                }
            }
            else {
                if (config.url.indexOf('http://127.0.0.1:8883/get?url=') === -1) {
                    config.url = 'http://127.0.0.1:8883/get?url='
                        + encodeURIComponent(config.url)
                        + '&original-url='
                        + encodeURIComponent(window.location.href);
                }
            }
            if (window['ngIdle'] === false) {
                if (config.cache) {
                    var cacheName = config.cache.info();
                    cacheMapping[config.url] = cacheName.id;
                }
                else {
                    cacheMapping[config.url] = '$http';
                }
            }
            return $q.when(config);
        },
        requestError: function (rejection) {
            hCounter.decr();
            return $q.reject(rejection);
        },
        response: function (response) {
            if (response.headers('ngservercached') === 'yes' && window['ngIdle'] === false) {
                engineQueue.addDependency(response.config.url, cacheMapping[response.config.url]);
            }
            $log.dev('httpResponse', response.config.url);
            hCounter.decr();
            return $q.when(response);
        },
        responseError: function (response) {
            $log.dev('httpResponse', response.config.url);
            hCounter.decr();
            return $q.reject(response);
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HttpInterceptorQueue;
