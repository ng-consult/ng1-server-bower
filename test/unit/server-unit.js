var be = before(window);

describe("Server-side enabled - mock.module('test')", function () {
    //todo fix tests
    var uid= 123;
    var restServerURL =  'http://domain.com';
    var socketServerURL = 'http://localhost:8882';
    describe('The unit test is mocked', function() {
        beforeEach(function() {
            //be.global();
            be.server('server', {
                ServerConfig: {
                    uid: uid
                }});
            be.injectServer();
        });
        it('should launch correctly', function (done) {
            $rootScope.$on('InternIdle', function (event) {
                expect(event).to.be.defined;
                done();
            });
            $timeout.flush(serverConfigHelper.getTimeoutValue() );
        });

        describe('ServerConfig', function() {

            it('It detects that we are on server', function() {
                expect(serverConfigHelper.onServer()).eql(true);
            });


            it('Gets the correct uid, socketServerURL, restServerURL URLs', function() {
                expect(serverConfigHelper.getUID()).eql(uid);
                expect(serverConfigHelper.getRestServer()).eql(restServerURL);
                expect(serverConfigHelper.getSocketServer()).eql(socketServerURL);
            });

        });

    });

    describe('$q promise', function () {

        var asyncGreet;
        beforeEach(function() {
            be.server('server', {ServerConfig: {uid: uid}});
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

                $timeout.flush(serverConfigHelper.getTimeoutValue());

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

                serverConfigHelper.setTimeoutValue(400);

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

                $timeout.flush(serverConfigHelper.getTimeoutValue());

                expect(resolved).to.be.not.ok;
                expect(rejected).to.be.not.ok;

                $timeout.flush(600);

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


                $timeout.flush(serverConfigHelper.getTimeoutValue());


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

                $q.race(promises).then(function(data) {
                    //console.log('resolved with', data);
                    resolved = true;
                }, function(err) {
                    //console.log('rejected with', err);
                    rejected = true;
                });

                $timeout.flush(1500);
            });

        });

    });

    describe('Log', function () {

        var msg = "LOG TEST";

        var socketEmit;


        beforeEach(function () {
            be = before(window);
            be.server('server', {ServerConfig: {uid: uid}});
            be.injectServer();
            socketEmit = sinon.stub(socket, 'emit');
        });

        afterEach(function () {
            socketEmit.restore();
        })

        it('Stubs the socket.emit', function () {

            socket.emit('test', {});

            expect(socketEmit.called).to.be.true;

            expect(socketEmit.calledWithExactly('test', {})).to.be.true;

        });

        ['log', 'warn', 'debug', 'error', 'info'].forEach(function (logName) {

            it('$log.' + logName + '()', function () {

                $log[logName].apply(null, [msg]);

                expect(socketEmit.calledWithExactly('LOG', {
                    type: logName,
                    args: [msg]
                })).to.be.true;

            });

        });

    });
    
    describe('The dev log with serverDebug enabled', function() {

        var socketEmit;

        beforeEach(function() {
            be = before(window);
            be.server('server', {ServerConfig: {uid: uid, debug: true}});
            be.injectServer();
            socketEmit = sinon.stub(socket, 'emit');
        });

        afterEach(function () {
            socketEmit.restore();
        });

        it('should emit()', function() {
            $log.dev('Hello', 'world');
            expect(socketEmit.calledWith('LOG')).to.be.true;
        });

    });

    describe('The dev log with serverDebug disabled', function() {

        var socketEmit;

        beforeEach(function() {
            be = before(window);
            be.server('server', {ServerConfig: {uid: uid, debug: false}});
            be.injectServer();
            socketEmit = sinon.stub(socket, 'emit');
        });

        afterEach(function () {
            socketEmit.restore();
        });

        it('should not emit()', function() {
            $log.dev('Hello', 'world');
            expect(socketEmit.calledWith('LOG')).to.be.false;
        });

    });

    describe('Error Handler', function () {

        var exceptionMessage = 'Some error';

        beforeEach(function() {
            be = before(window);
            be.server('server',{ServerConfig: {uid: uid}});
            be.injectServer();
        });

        it('should catch a ServerExceptionHandler event', function (done) {

            window.addEventListener('ExceptionHandler', function () {
                done();
            });

            try{
                $exceptionHandler(exceptionMessage);
            } catch(e) {

            }

        });

         it('should log the message in the error log: ', function () {

             try{
                 $exceptionHandler(exceptionMessage);
             } catch(e){
                 expect($log.error).to.haveBeenCalled;
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