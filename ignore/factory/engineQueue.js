"use strict";
var EngineQueue = function ($log, $rootScope, $window, socket) {
    var doneVar = {};
    $rootScope.exception = false;
    $window.addEventListener('ExceptionHandler', function () {
        $rootScope.exception = true;
    });
    var setStatus = function (name, value) {
        if (isDone) {
            return;
        }
        doneVar[name] = value;
        if (value === true) {
            done(name);
        }
    };
    var isDone = false;
    var areDoneVarAllTrue = function () {
        for (var key in doneVar) {
            if (!doneVar[key]) {
                return false;
            }
        }
        return true;
    };
    var done = function (from) {
        $log.dev('engineQueue.isDone()', from, doneVar);
        if (isDone) {
            return isDone;
        }
        if (areDoneVarAllTrue() && $rootScope.exception === false) {
            isDone = true;
            if ($window['onServer'] === true) {
                socket.emit('IDLE', {
                    html: document.documentElement.outerHTML,
                    doctype: new XMLSerializer().serializeToString(document.doctype),
                    url: window.location.href,
                    uid: $window['serverConfig'].uid
                });
                socket.on('IDLE' + $window['serverConfig'].uid, function () {
                    var Event = $window['Event'];
                    var dispatchEvent = $window.dispatchEvent;
                    var IdleEvent = new Event('Idle');
                    dispatchEvent(IdleEvent);
                    $rootScope.$broadcast('InternIdle');
                });
            }
            else {
                var Event_1 = $window['Event'];
                var dispatchEvent_1 = $window.dispatchEvent;
                var IdleEvent = new Event_1('Idle');
                dispatchEvent_1(IdleEvent);
                console.log('IDLE');
                $rootScope.$broadcast('InternIdle');
            }
        }
        return isDone;
    };
    return {
        isDone: done,
        setStatus: setStatus
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EngineQueue;
