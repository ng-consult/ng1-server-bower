'use strict';

const HttpInterceptorQueue = ($q, $log, counter) => {

    $log.dev('HttpInterceptor', 'instanciated', this);

    const hCounter = counter.create('http');

    return {
        request:  (config) => {
            $log.dev('httpRequest', config.url);
            hCounter.incr();
            //todo rest caching
            /*
            1 - redirect request to Rest server
            2 - rest server check if the request is cache/not cahced/ should cache
            3 - rest server returns the result
             */
            return $q.when(config);
        },
        requestError: (rejection) => {
            hCounter.decr();
            return $q.reject(rejection);
        },
        response:  (response) =>{
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