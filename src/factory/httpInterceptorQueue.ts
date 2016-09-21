'use strict';

const HttpInterceptorQueue = ($q, $window, $rootScope, TimeoutValue, counter) => {

    const hCounter = counter.create('http');

    return {
        request:  (config) => {
            hCounter.incr();
            return $q.when(config);
        },
        requestError: (rejection) => {
            hCounter.decr();
            return $q.reject(rejection);
        },
        response:  (response) =>{
            hCounter.decr();
            return $q.when(response);
        },
        responseError: (response) => {
            hCounter.decr();
            return $q.reject(response);
        }
    };
};

export default HttpInterceptorQueue;