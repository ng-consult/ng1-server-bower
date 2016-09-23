var be = before(window);


describe("Server-side enabled - mock.module('test')", function () {


    describe('The unit test is mocked', function() {
        beforeEach(function() {
            //be.global();
            be.server('server');
            be.injectServer();
        });
        it('should launch correctly', function (done) {
            window.addEventListener('Idle', function (event) {
                expect(event).to.be.defined;
                done();
            });

            $timeout.flush(timeoutValue.get());
        });
    });

    describe('$q promise', function () {

        var asyncGreet;
        beforeEach(function() {
            be.server('server');
            be.injectServer();
            asyncGreet = function(name, toBeResolved, time) {
                return $q(function (resolve, reject) {
                    $timeout(function () {
                        if(toBeResolved) {
                            resolve('Hello, ' + name + '!');
                        } else {
                            reject('Hold back, ' + name + '!');
                        }
                        $rootScope.$digest();
                    }, time);
                });
            };
        });

        describe('$q.when()', function() {

            it('$q.when() with 1 promise that takes 1000ms to resolve', function(done) {
                var resolved = false;

                window.addEventListener('Idle', function () {
                    expect(resolved).to.be.ok;
                    done();
                });

                $q.when(asyncGreet('world', true, 1000)).then(function() {
                    resolved = true;
                });

                $timeout.flush(timeoutValue.get());

                expect(resolved).to.eql(false);

                $timeout.flush(800);
            });
        });
        describe('$q.all()', function() {
            it('$q.all() with 10 promises that takes 1000ms to resolve', function(done) {

                var resolved = false;

                window.addEventListener('Idle', function () {
                    expect(resolved).to.be.ok;
                    done();
                });

                var promises = [];

                for(var i=0;i<10;i++) {
                    promises.push(asyncGreet('World', true, 1000));
                }

                var all = $q.all(promises).then(function(data) {
                    resolved = true;
                });

                $timeout.flush(1000);

            });


            it('$q.all() with 10 promises that takes 1000ms to resolve, and the last that gets rejected', function(done) {

                var resolved = false;
                var rejected = false;

                timeoutValue.set(200);

                window.addEventListener('Idle', function () {
                    expect(resolved).to.be.not.ok;
                    expect(rejected).to.be.ok;
                    done();
                });

                var promises = [];

                for(var i=0;i<9;i++) {
                    promises.push(asyncGreet('World', true, 1000));
                }
                promises.push(asyncGreet('Joe', false, 1000));

                var all = $q.all(promises).then(function(data) {
                    resolved = true;
                }, function(err) {
                    //console.log('rejected with', err);
                    rejected = true;
                });

                $timeout.flush(timeoutValue.get());

                expect(resolved).to.be.not.ok;
                expect(rejected).to.be.not.ok;

                $timeout.flush(800);

            });

        });

        describe('$q.race()', function() {

            it('$q.race() timeoutValue = 200, with 1st promise that takes 100ms to get rejected and 9 promises that takes 150ms to resolve', function(done) {

                var resolved = false;
                var rejected = false;

                window.addEventListener('Idle', function () {
                    expect(resolved).to.be.not.ok;
                    expect(rejected).to.be.ok;
                    done();
                    done();
                });

                var promises = [];

                promises.push(asyncGreet('Joe', false, 100));

                for(var i=0;i<10;i++) {
                    promises.push(asyncGreet('World', true, 150));
                }

                $q.race(promises).then(function(data) {
                    resolved = true;
                }, function(err) {
                    rejected = true;
                });


                $timeout.flush(timeoutValue.get());


            });

            it('$q.race() , timeoutValue=200, with 1st promise that takes 1000ms to get rejected and 9 promises that takes 1500ms to resolve', function(done) {

                var resolved = false;
                var rejected = false;


                window.addEventListener('Idle', function () {
                    expect(resolved).to.be.not.ok;
                    expect(rejected).to.be.ok;
                    done();
                });

                var promises = [];

                promises.push(asyncGreet('Joe', false, 1000));

                for(var i=0;i<10;i++) {
                    promises.push(asyncGreet('World', true, 1500));
                }

                var race = $q.race(promises).then(function(data) {
                    //console.log('resolved with', data);
                    resolved = true;
                }, function(err) {
                    //console.log('rejected with', err);
                    rejected = true;
                });


                $timeout.flush(1000);

            });

        });

    });

    describe('Log', function () {

        var msg = "LOG TEST";

        ['log', 'warn', 'debug', 'error', 'info'].forEach(function (logName) {
            describe('$log.' + logName + '()', function () {

                var path;
                beforeEach(function() {
                    be = before(window);
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
                be = before(window);
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
            be = before(window);
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