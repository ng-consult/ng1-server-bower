'use strict';

describe("No Server side definition", function () {

    var $rootScope, $componentController;

    describe('General', function() {
        beforeEach(function() {

            delete window.onServer;
            delete window.fs;
            delete window.logConfig;


            var app = angular.module('app', ['server'])
                .component('appComponent', {
                    template: "<input type='text' ng-model='item'/>",
                    controller: function () {
                        var ctrl = this;
                        this.item = 'text';
                    },
                    bindings: {}
                });


            angular.mock.module('app');

        });


        beforeEach(inject(function (_$componentController_, _$rootScope_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
        }));

        it('The app should run ', function () {

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

    describe('Log - somehow, angular.js doesnt trigger the console[type] on sinon.js, so IM not sure how to test this.', function() {

    });

});
