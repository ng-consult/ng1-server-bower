'use strict';
var ExceptionHandler = function ($delegate, $log, $window) {
    var Event = $window['Event'];
    var dispatchEvent = $window.dispatchEvent;
    var IdleEvent = new Event('ExceptionHandler');
    return function (exception, cause) {
        dispatchEvent(IdleEvent);
        $log.debug('Default exception handler.');
        $delegate(exception, cause);
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExceptionHandler;
