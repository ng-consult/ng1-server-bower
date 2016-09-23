'use strict';
var be = before(window);

describe("No Server side definition", function () {

    describe('General', function() {

        var app = angular.module('app', ['server']).component('appComponent', {
            template: "<input type='text' ng-model='item'/>",
            controller: function () {
                var ctrl = this;
                this.item = 'text';
            },
            bindings: {}
        });

        beforeEach(function() {
            be.noServer('app');
            be.injectNoServer()
        });

        it('The app should run ', function () {

            console.log('inside it', $componentController);
            var ctrl = $componentController('appComponent');

            expect(ctrl.item).to.eql('text');
        });

        it('It should not throw an Idle Event', function(done) {

            var ctrl = $componentController('appComponent');

            var idleTriggered = false;

            window.addEventListener('Idle', function (event) {
                idleTriggered = true;
            });

            setTimeout(function() {
                expect(idleTriggered).to.eql(false);
                done();
            }, 4000);

        });
    });

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

        it('should not contain a $log.dev function', function() {
            expect($log.dev).to.be.undefined;
        });
    });

});
