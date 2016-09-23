var be = before(window);
be.global();


describe('Server side Enabled - Custom app definition', function () {

    describe('A ng-model gets updated app', function () {

        var app = angular.module('appNgModel', ['server'])
            .component('appComponent', {
                template: "<input type='text' ng-model='item'/>",
                controller: function () {
                    var ctrl = this;
                    this.item = 'text';
                },
                bindings: {}
            });

        beforeEach(function () {
            be.server('appNgModel');
            be.injectServer();
        });

        it('The Idle event should be caught after the ng-model value changes', function (done) {

            var modelChanged = false;

            window.addEventListener('Idle', function (event) {
                expect(modelChanged).to.be.ok;
                done();
            });

            var ctrl = $componentController('appComponent');

            expect(ctrl.item).to.eql('text');

            ctrl.item = 'changed';

            modelChanged = true;

            $timeout.flush(timeoutValue.get());

        });

        it('The Idle event should be caught after the ng-model value changes 1000 times', function (done) {

            var modelChangedCount = 0;

            window.addEventListener('Idle', function (event) {
                expect(modelChangedCount).to.eql(1000);
                done();
            });

            var ctrl = $componentController('appComponent');


            $timeout.flush(timeoutValue.get());

            for (var i = 0; i < 1000; i++) {
                ctrl.item = 'changed' + i;
                modelChangedCount++;
                $rootScope.$digest();
            }
            expect(ctrl.item).to.eql('changed999');
        });

    });

    describe('Component app that loads a failed reuqest', function () {
        var app = angular.module('appJSON', ['server'])
            .component('appComponent', {
                template: "<div ng-repeat='item in $ctrl.list'><input type='text' ng-model='item'></div>",
                controller: function ($http) {
                    var ctrl = this;
                    this.list = [];
                    this.error1;
                    this.error2;

                    $http.get('/big.json').then(function (list) {
                        ctrl.list = list.data;
                    }, function (err) {
                        ctrl.error1 = err.status;
                    });
                },
                bindings: {}
            });

        beforeEach(function () {
            be.server('appJSON');
            be.injectServer();
        });

        after(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('Should trigger a Idle event after the http loads ok - 1000ms', function (done) {
            var jsonFailed = false;

            window.addEventListener('Idle', function (event) {
                expect(jsonFailed).to.be.ok;
                done();
            });

            var ctrl = $componentController('appComponent');

            $timeout(function () {
                $httpBackend.flush();
                $rootScope.$digest();
                expect(ctrl.list.length).to.eql(0);
                expect(ctrl.error1).to.eql(400);
                jsonFailed = true;

            }, 1000);


            $httpBackend.when('GET', '/big.json').respond(400, {});

            $timeout.flush(1000);

        });
    });

    describe('Component App that loads a BIG json file', function () {

        var app = angular.module('appJSON2', ['server'])
            .component('appComponent', {
                template: "<div ng-repeat='item in $ctrl.list'><input type='text' ng-model='item'></div>",
                controller: function ($http) {
                    var ctrl = this;
                    this.list = [];

                    $http.get('/big.json').then(function (list) {
                        ctrl.list = list.data;
                    });


                },
                bindings: {}
            });

        beforeEach(function () {
            be.server('appJSON2');
            be.injectServer();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });


        it('Should trigger a Idle event after the http loads ok - 1000ms', function (done) {
            var jsonLoaded = false;
            $httpBackend.when('GET', '/big.json').respond(window.bigJSON);

            window.addEventListener('Idle', function (event) {
                expect(jsonLoaded).to.be.ok;
                done();
            });

            var ctrl = $componentController('appComponent');

            $timeout(function () {
                $httpBackend.flush();
                jsonLoaded = true;
                expect(ctrl.list.length).to.eql(window.bigJSON.length);
            }, 1000);

            $timeout.flush(timeoutValue.get());

            expect(ctrl.list.length).to.eql(0);

            $timeout.flush(1000-timeoutValue.get());
        });

    });

    describe('Filters', function () {

        var nbIterations = 1000;

        var app = angular.module('appFilters', ['server'])
            .component('appComponent', {
                template: "",
                controller: function ($filter) {

                    this.dates = [];

                    this.bigFilter = function () {
                        for (var i = 0; i < nbIterations; i++) {
                            this.dates.push($filter('date')(Date.now()));
                        }
                    }

                },
                bindings: {}
            });

        beforeEach(function () {
            be.server('appFilters');
            be.injectServer();
        });

        it('It should catch Idle event once the dates are $filtered', function (done) {

            window.addEventListener('Idle', function (event) {
                //console.info('test','test', 'LENGTH = ',ctrl.dates.length);
                expect(ctrl.dates.length).to.equal(nbIterations);
                done();
            });

            var ctrl = $componentController('appComponent');

            $timeout.flush(timeoutValue.get());
            ctrl.bigFilter();

        })
    });


});
