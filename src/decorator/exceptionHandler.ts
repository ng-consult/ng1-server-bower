'use strict';


const ExceptionHandler = ($delegate, $window) => {

    let errorHandler = (error, cause) => {
        let err = new Error();
        let stack = err['stack'];
        let errorEvent = new $window.CustomEvent('ServerExceptionHandler');
        errorEvent.details =  {
            exception: error,
            cause: cause,
            err: stack
        };
        $window.dispatchEvent(errorEvent);
        return $delegate(error, cause);
    };

    return errorHandler;
};

export default ExceptionHandler;