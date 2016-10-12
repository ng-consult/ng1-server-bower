'use strict';
var _this = this;
var HttpInterceptorQueue = function ($q, $log, counter) {
    $log.dev('HttpInterceptor', 'instanciated', _this);
    var hCounter = counter.create('http');
    return {
        request: function (config) {
            $log.dev('httpRequest', config.url);
            hCounter.incr();
            return $q.when(config);
        },
        requestError: function (rejection) {
            hCounter.decr();
            return $q.reject(rejection);
        },
        response: function (response) {
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
