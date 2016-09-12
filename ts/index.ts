/**
 * Created by antoine on 11/09/16.
 */

import $EngineQueueProvider from './provider/engineQueue';
import $QProvider from './provider/q';

angular.module('server', [])
    .provider('$engineQueue', $EngineQueueProvider)
    .provider('$q', $QProvider)
    .config(function($provide) {


        if(typeof window.onServer !== 'undefined' && window.onServer === true) {


            $provide.decorator('$exceptionHandler',  ($delegate, $log, $window) => {

                let errorHandler = (error, cause) => {
                    let err = new Error();
                    let stack = err.stack;
                    let errorEvent = new $window.CustomEvent('ServerExceptionHandler');
                    errorEvent.details =  {
                        exception: error,
                        cause: cause,
                        err: err.stack
                    };
                    $window.dispatchEvent(errorEvent);
                    $delegate(error, cause);
                };

                return errorHandler;
            });

            if(typeof window.fs !== 'undefined' && typeof window.logConfig!== 'undefined') {

                let fs = window.fs;
                let config = window.logConfig;

                $provide.decorator('$log', [
                    '$delegate',
                    function logDecorator($delegate) {

                        var myLog = {
                            warn: function(msg) {
                                log(msg, 'warn');
                            },
                            error: function(msg) {
                                log(msg, 'error');
                            },
                            info: function(msg) {
                                log(msg, 'info');
                            },
                            debug: function(msg) {
                                log(msg, 'debug');
                            },
                            log: function(msg) {
                                log(msg, 'log');
                            }
                        };

                        let log = (msg, type) => {

                            let date = new Date();
                            let logMsg = date + " -> " + msg + '\n';
                            if(config[type]['stack'] ===true) {
                                var err = new Error();
                                var stack = err.stack;
                                logMsg += stack +'\n\n';
                            }
                            fs.appendFile(config[type]['path'], logMsg, (err) => {
                                if (err) throw err;
                            });
                        };

                        return myLog;
                    }
                ]);
            }
        }
    });