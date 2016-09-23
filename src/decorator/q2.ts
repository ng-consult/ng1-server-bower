'use strict';
/*

 Promise {
 $$state
 then
 catch
 fially
 }

 Deferred{
 promise = new Promise()
 resolve
 reject
 notify
 }

 reject() -> new Deferred
 when() -> new Deffered
 resolve = when
 all -> new Deferred
 race -> new Deferred

 $Q -> function(resolver) -> new Deferred
 return deferred.promise

 $Q.prototype = Promise.prototype
 $Q.defer
 $Q.reject
 $Q.race
 $Q.all
 $Q.resolve
 $Q.when

 */

const Q = function ($delegate, $rootScope, TimeoutValue, counter) {

    var qCounter = counter.create('q');

    // Getting the $Q definition
    var proto = $delegate.prototype;
    var Odefer = $delegate.defer;
    var Oreject = $delegate.reject;
    //  we dont need to alter these
    var Orace = $delegate.race;
    var Oall = $delegate.all;
    var Oresolve = $delegate.resolve;

    //Altering the $Q definition
    const deferFn = function(context) {
        return function() {

            var deferred =  Odefer.apply(context, []);

            var originalDeferResolve = deferred.resolve;

            deferred.resolve = function() {
                qCounter.decr();
                //console.warn('nb promises:  ', qCounter.getCount());
                return originalDeferResolve.apply(deferred, arguments);
            };

            var originalDeferReject = deferred.reject;

            deferred.reject = function() {
                qCounter.decr();
                //console.warn('nb promises:  ', qCounter.getCount());
                return originalDeferReject.apply(deferred, arguments);
            };

            qCounter.incr();
            //console.warn('nb promises:  ', qCounter.getCount());
            return deferred;
        }
    };
    
    var $Q = function(resolver) {
        //console.warn('creating new Q()');
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

export default Q;