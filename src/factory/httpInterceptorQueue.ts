'use strict';

const HttpInterceptorQueue = ($q, $log, counter) => {

    $log.dev('HttpInterceptor', 'instanciated', this);

    const hCounter = counter.create('http');

    return {
        request:  (config) => {
            $log.dev('httpRequest', config.url);
            hCounter.incr();
            return $q.when(config);
        },
        requestError: (rejection) => {
            hCounter.decr();
            return $q.reject(rejection);
        },
        response:  (response) =>{
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