var be = before(window);

describe("No Server side definition", function () {

    describe('General', function() {

        var app = angular.module('appNoServer', ['server']).component('appComponent', {
            template: "<input type='text' ng-model='item'/>",
            controller: function () {
                var ctrl = this;
                this.item = 'text';
            },
            bindings: {}
        });

        beforeEach(function() {
            be.global();
            be.noServer('appNoServer');
            be.injectNoServer()
        });

        it('The app should run ', function () {
            var ctrl = $componentController('appComponent');

            expect(ctrl.item).to.eql('text');

            $timeout.flush(timeoutValue.get());
        });

        it('It should throw an Idle Event', function(done) {

            var ctrl = $componentController('appComponent');

            var idleTriggered = false;

            window.addEventListener('Idle', function (event) {
                idleTriggered = true;
                done();
            });

            $timeout.flush(timeoutValue.get());

        });
    });

    describe('default TimeoutValue', function() {
        beforeEach(function() {
            be.noServer('server');
            be.injectNoServer()
        });

        it('Idle event should be thrown with the default value ' , function(done) {
            window.addEventListener('Idle', function (event) {
                expect(event).to.not.be.undefined;
                done();
            });
            $timeout.flush(timeoutValue.get());
        });

        it('Idle event should be thrown with a timeoutValue of 2000' , function(done) {
            timeoutValue.set(2000);
            var idleCaught = false;
            window.addEventListener('Idle', function (event) {
                expect(event).to.not.be.undefined;
                idleCaught = true;
            });

            expect(idleCaught).to.eql(false);

            $timeout(function() {
                done();
            }, 100);

            $timeout.flush(2000);

            expect(idleCaught).to.eql(false);

            $timeout.flush(100);

            expect(idleCaught).to.eql(true);

        });

    });

    describe('Custom timeoutvalue', function() {

        beforeEach(function() {
            be.noServer('server', {clientTimeoutValue: 500});
            be.injectNoServer();
        });

        it('Should get the timeoutValue from the window.clientTimeoutValue', function() {
            expect(timeoutValue.get()).to.eql(500);
            $timeout.flush(timeoutValue.get());

        });
    })

    describe('Log', function() {

        beforeEach(function() {
            be.noServer('server');
            be.injectNoServer()
        });

        var msg = 'test';

        ['log', 'warn', 'info', 'debug', 'error'].forEach(function(log) {
            it('Should display a $log.'+log, function() {
                $log[log].apply(window, [msg]);
                expect($log[log].logs.length).to.eql(1);
                expect($log[log].logs[0][0]).to.eql(msg);
            });
        });

        it('$log.dev should not display anything function', function() {

            $log.dev('something');

            ['log', 'warn', 'info', 'debug', 'error'].forEach(function(log) {
                    expect($log[log].logs.length).to.eql(0);
            });

        });
    });

});
