"use strict";
var EngineQueue = function ($log, $rootScope, $window, $cacheFactory, socket) {
    var doneVar = {};
    var dependencies = {};
    var addDependency = function (url, cacheId) {
        if (typeof dependencies[cacheId] === 'undefined') {
            dependencies[cacheId] = [];
        }
        dependencies[cacheId].push(url);
    };
    $window['ngIdle'] = false;
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
    var getExportedCache = function () {
        var exportedCache = {};
        var _loop_1 = function(cacheId) {
            exportedCache[cacheId] = {};
            var cachedUrls = $cacheFactory.export(cacheId);
            dependencies[cacheId].forEach(function (cachedUrl) {
                exportedCache[cacheId][cachedUrl] = cachedUrls[cachedUrl];
            });
        };
        for (var cacheId in dependencies) {
            _loop_1(cacheId);
        }
        console.log('cachedURLs = ', exportedCache);
        return exportedCache;
    };
    var done = function (from) {
        $log.dev('engineQueue.isDone()', from, doneVar);
        if (isDone) {
            return isDone;
        }
        if (areDoneVarAllTrue() && $rootScope.exception === false) {
            isDone = true;
            $window['ngIdle'] = true;
            if ($window['onServer'] === true) {
                socket.emit('IDLE', {
                    html: document.documentElement.outerHTML,
                    doctype: new XMLSerializer().serializeToString(document.doctype),
                    url: window.location.href,
                    uid: $window['serverConfig'].uid,
                    exportedCache: getExportedCache()
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
        setStatus: setStatus,
        addDependency: addDependency
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EngineQueue;
