'use strict';

var files = {};

window.onServer = true;
window.fs = {
    appendFile: function (path, msg, cb) {
        files[path] = msg;
    }
};
window.logConfig = {
    dir: '/var/log/angular',
    warn: {
        enabled: true,
        stack: false
    },
    log: {
        enabled: true,
        stack: false
    },
    debug: {
        enabled: false,
        stack: false
    },
    error: {
        enabled: true,
        stack: false
    },
    info: {
        enabled: false,
        stack: false
    }
};


describe("Angular.js-server client side module unit testing", function () {


    var $httpBackend, $rootScope, $q, counter, $log, $exceptionHandler;

    beforeEach(angular.mock.module('server'));
    beforeEach(inject(function (_$httpBackend_, _$rootScope_, _counter_, _$q_, _$log_, _$exceptionHandler_) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_.$new();
        counter = _counter_;
        $q = _$q_;
        $log = _$log_;
        $exceptionHandler = _$exceptionHandler_;
        $httpBackend.when('GET', '/someInexistantValue').respond({});
        $httpBackend.flush();
        $rootScope.$digest();

    }));


    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    //console.warn($log);

    it('should launch correctly', function (done) {
        expect(counter.getCount('http')).to.eql(0);
        expect(counter.getCount('q')).to.eql(0);
        expect(counter.getCount('digest')).to.eql(0);

        window.addEventListener('Idle', function (event) {
            expect(event).to.be.defined;
            done();
        });

        setTimeout(function () {
            $rootScope.$digest();
            expect(counter.getCount('http')).to.eql(0);
            expect(counter.getCount('q')).to.eql(0);
            expect(counter.getCount('digest')).to.eql(0);
            $rootScope.$digest();
        }, 500);
    });


    describe('$q promise that takes 1000ms to resolve', function () {

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

        describe('Logging Test', function () {

            it('$log should have a formatMsg function', function () {
                expect(typeof $log.formatMsg).to.eql('function');
            });

            var msg = "LOG TEST";

            ['log', 'warn', 'debug', 'error', 'info'].forEach(function (logName) {
                describe('$log.' + logName + '()', function () {

                    var path;

                    beforeEach(function () {
                        files = {};
                        path = window.logConfig.dir + '/' + logName;
                        $log[logName].apply(null, [msg]);
                    });


                    if (window.logConfig[logName].enabled === true) {

                        it('should write into the correct log file', function () {
                            expect(typeof files[path]).to.not.be.undefined;
                        });

                        it('should write the DATE formatted msg', function () {
                            expect(files[path]).to.eql($log.formatMsg([msg]));
                        });
                    } else {

                        it('should NOT write into the correct log file', function () {
                            expect(typeof files[path]).to.eql('undefined');
                        });
                    }
                });
            });
        });

        describe('Error Handler', function () {

            var exceptionMessage = 'Some error';

            beforeEach(function () {
                files = {};
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

            /*
             it('should log the message in the error log: ', function (done) {

             $exceptionHandler(exceptionMessage);
             //console.info('test','test', 'files = ', {});
             expect(files.error).to.not.be.undefined;

             });
             */
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


});