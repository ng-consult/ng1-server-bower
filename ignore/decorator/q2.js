'use strict';
var Q = function ($delegate, counter) {
    var qCounter = counter.create('q');
    var proto = $delegate.prototype;
    var Odefer = $delegate.defer;
    var Oreject = $delegate.reject;
    var Orace = $delegate.race;
    var Oall = $delegate.all;
    var Oresolve = $delegate.resolve;
    var deferFn = function (context) {
        return function () {
            var deferred = Odefer.apply(context, []);
            var originalDeferResolve = deferred.resolve;
            deferred.resolve = function () {
                qCounter.decr();
                return originalDeferResolve.apply(deferred, arguments);
            };
            var originalDeferReject = deferred.reject;
            deferred.reject = function () {
                qCounter.decr();
                return originalDeferReject.apply(deferred, arguments);
            };
            qCounter.incr();
            return deferred;
        };
    };
    var $Q = function (resolver) {
        if (typeof resolver !== 'function') {
            throw new Error('norslvr - Expected resolverFn, got - resolver');
        }
        var deferred = deferFn(this)();
        function resolveFn(value) {
            deferred.resolve(value);
        }
        function rejectFn(reason) {
            deferred.reject(reason);
        }
        resolver(resolveFn, rejectFn);
        return deferred.promise;
    };
    $Q.prototype = proto;
    $Q.defer = deferFn($delegate);
    $Q.reject = $delegate.reject;
    $Q.when = $delegate.when;
    $Q.resolve = Oresolve;
    $Q.all = Oall;
    $Q.race = Orace;
    return $Q;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Q;
