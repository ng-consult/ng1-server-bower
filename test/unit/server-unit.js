'use strict';

var be = before(window);
be.global();

describe("Server-side enabled - mock.module('test')", function () {


    describe('The unit test is mocked', function() {
        beforeEach(function() {
            be.server('server');
            be.injectServer();
        });
        it('should launch correctly', function (done) {
            window.addEventListener('Idle', function (event) {
                expect(event).to.be.defined;
                done();
            });

            $timeout.flush(TimeoutValue);
        });
    });

    describe('$q promise that takes 1000ms to resolve', function () {

        beforeEach(function() {
            be.server('server');
            be.injectServer();
        });

        it('Should catch the Idle event after the promises are resolved', function (done) {

            var resolved = [false, false, false, false];

            window.addEventListener('Idle', function () {
                console.info('test', 'test', resolved);
                expect(resolved[0]).to.be.ok;
                expect(resolved[1]).to.be.ok;
                expect(resolved[2]).to.be.ok;
                expect(resolved[3]).to.be.ok;
                done();
            });

            function okToGreet(name) {
                return name === 'World';
            }

            function asyncGreet(name) {
                // perform some asynchronous operation, resolve or reject the promise when appropriate.
                return $q(function (resolve, reject) {
                    setTimeout(function () {
                        if (okToGreet(name)) {
                            console.info('test', 'test', 'resolving ', name);
                            resolve('Hello, ' + name + '!');
                            $rootScope.$digest();
                        } else {
                            console.info('test', 'test', 'rejecting', name);
                            reject('Greeting ' + name + ' is not allowed.');
                            $rootScope.$digest();
                        }
                    }, 1000);
                });
            }


            function asyncGreetDefer(name) {
                var defer = $q.defer();
                setTimeout(function () {
                    if (okToGreet(name)) {
                        console.info('test', 'test', 'defer-resolving ', name);
                        defer.resolve('Hello, ' + name + '!');
                        $rootScope.$digest();
                    } else {
                        console.info('test', 'test', 'defer-rejecting', name);
                        defer.reject('Greeting ' + name + ' is not allowed.');
                        $rootScope.$digest();
                    }
                }, 1000);
                return defer.promise;
            }

            $timeout.flush(TimeoutValue);

            var promise = asyncGreet('Robin Hood');
            //$rootScope.$digest();

            promise.then(function (greeting) {
                //console.info('test', 'test', 'Success: ' + greeting);

            }, function (reason) {
                expect(reason).to.not.be.undefined;
                //console.info('test', 'test', 'Failed: ' + reason);

            }).catch(function (e) {
                //console.info('test', 'test', 'error caught', e);

            }).finally(function () {
                resolved[0] = true;
                expect(true).to.be.ok;
                //console.info('test', 'test', 'finally reached', resolved);
            });
            //$rootScope.$digest();


            var promise = asyncGreet('World');
            promise.then(function (greeting) {
                expect(greeting).to.not.be.undefined;
                //console.info('test', 'test', 'Success: ' + greeting);
            }, function (reason) {
                //console.info('test', 'test', 'Failed: ' + reason);
            }).catch(function (e) {
                //console.info('test', 'test', 'error caught', e);
            }).finally(function () {
                resolved[1] = true;
                //console.info('test', 'test', 'finally reached', resolved);
            });


            var promise = asyncGreetDefer('Robin Hood');
            promise.then(function (greeting) {
                //console.info('test', 'test', 'Success: ' + greeting);
            }, function (reason) {
                expect(reason).to.not.be.undefined;
                //console.info('test', 'test', 'Failed: ' + reason);
            }).catch(function (e) {
                //console.info('test', 'test', 'error caught', e);
            }).finally(function () {
                resolved[2] = true;
                //console.info('test', 'test', 'finally reached', resolved);
            });

            var promise = asyncGreetDefer('World');
            promise.then(function (greeting) {
                expect(greeting).to.not.be.undefined;
                //console.info('test', 'test', 'Success: ' + greeting);
            }, function (reason) {
                //console.info('test', 'test', 'Failed: ' + reason);
            }).catch(function (e) {
                //console.info('test', 'test', 'error caught', e);
            }).finally(function (fin) {
                resolved[3] = true;
                //console.info('test', 'test', 'finally reached', resolved);
            });
        });
    });

    describe('Log', function () {

        var msg = "LOG TEST";

        ['log', 'warn', 'debug', 'error', 'info'].forEach(function (logName) {
            describe('$log.' + logName + '()', function () {

                var path;
                beforeEach(function() {
                    be.server('server');
                    be.injectServer();
                    $log.reset();
                });

                if (window.logConfig[logName].enabled === true) {

                    beforeEach(function() {
                        path = window.logConfig.dir + '/' + logName;
                        $log[logName].apply(null, [msg]);
                    });

                    it('should write into the correct log file', function () {
                        expect(typeof files[path]).to.not.be.undefined;
                    });

                    it('Should not write logging on the screen', function() {
                        expect(console[logName]).to.not.haveBeenCalled;
                    });

                } else {

                    it('should NOT write into the correct log file', function () {
                        expect(typeof files[path]).to.eql('undefined');
                    });

                    it('Should  write debug on the screen', function() {
                        expect(console[logName]).to.haveBeenCalled;

//                        expect($log[logName].logs[0][0]).to.eql(msg);

                    });

                }
            });
        });

        describe('The dev log with serverDebug enabled', function() {
            beforeEach(function() {
                be.server('server');
                be.injectServer();
                $log.reset();
            });

            it('should call console.debug', function() {
                $log.dev('Hello', 'world');
                expect(console.debug).to.haveBeenCalled;
            });

            it('should write something on the dev file', function() {
                $log.dev('Hello', 'world');
                var path = window.logConfig.dir + '/dev';
                console.log('FILES = ',files);
                expect(typeof files[path]).to.not.be.undefined;
            });
        });

        describe('The dev log with serverDebug disabled', function() {
            beforeEach(function() {
                be.server('server', { serverDebug: false});
                be.injectServer();
                $log.reset();
            });

            it('should not call console.debug', function() {
                $log.dev('Hello', 'world');
                expect(console.debug).to.not.haveBeenCalled;
            });

            it('should not write something on the dev file', function() {
                $log.dev('Hello', 'world');
                var path = window.logConfig.dir + '/dev';
                expect(files[path]).to.be.undefined;
            });
        });
    });


    describe('Error Handler', function () {

        var exceptionMessage = 'Some error';

        beforeEach(function() {
            be.server('server');
            be.injectServer();
            $log.reset();
        });

        it('should catch a ServerExceptionHandler event', function (done) {

            window.addEventListener('ServerExceptionHandler', function (details) {
                expect(details).to.not.be.undefined;
                done();
            });

            $exceptionHandler(exceptionMessage);

        });

        it('should have the correct cause defined', function (done) {

            window.addEventListener('ServerExceptionHandler', function (event) {
                expect(event.details.exception).to.eql(exceptionMessage);
                done();
            });

            $exceptionHandler(exceptionMessage);

        });

         it('should log the message in the error log: ', function () {

             try{
                 $exceptionHandler(exceptionMessage);
             } catch(e){
                 expect(console.error).to.haveBeenCalled;
             }

         });

    });

    describe('$compile testing', function () {
        it('TODO', function () {

        });
    });

    describe('$animate testing', function () {
        it('TODO', function () {

        });
    });


    describe('Directive compilation', function () {

    });





});