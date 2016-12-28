'use strict';
import {IEngineQueue} from "../interfaces/definitions";


const ExceptionHandler = ($delegate, $log, $window) => {
    const Event = $window['Event'];
    const dispatchEvent = $window.dispatchEvent;
    const IdleEvent = new Event('ExceptionHandler');

    return function(exception, cause) {
        dispatchEvent(IdleEvent);
        //$log.debug('Default exception handler.');
        $delegate(exception, cause);
    };
};

export default ExceptionHandler;

/*

 function $ExceptionHandlerProvider() {
 this.$get = ['$log', function($log) {
 return function(exception, cause) {
 $log.error.apply($log, arguments);
 };
 }];
 }

 */