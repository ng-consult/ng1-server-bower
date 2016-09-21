
describe('Custom app definition', function() {

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
            enabled: false,
            stack: false
        },
        log: {
            enabled: false,
            stack: false
        },
        debug: {
            enabled: false,
            stack: false
        },
        error: {
            enabled: false,
            stack: false
        },
        info: {
            enabled: false,
            stack: false
        }
    };


    describe('A ng-model gets updated app', function () {
        var $componentController, $httpBackend;

        beforeEach(function () {
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

        beforeEach(inject(function (_$componentController_, _$rootScope_, _$httpBackend_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            $httpBackend.when('GET', '/someInexistantValue').respond({});
            $httpBackend.flush();
        }));

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
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

            $rootScope.$digest();
        });

        it('The Idle event should be caught after the ng-model value changes 1000 times', function (done) {

            var modelChangedCount = 0;

            window.addEventListener('Idle', function (event) {
                expect(modelChangedCount).to.eql(1000);
                done();
            });

            var ctrl = $componentController('appComponent');

            for (var i = 0; i < 1000; i++) {
                ctrl.item = 'changed' + i;
                modelChangedCount++;
                $rootScope.$digest();
            }
            expect(ctrl.item).to.eql('changed999');
        });

    });

    describe('Component App that loads a BIG json file', function () {
        var $httpBackend,
            $componentController,
            $scope;

        var backendMock = window.__json__['test/unit/small.json'];

        beforeEach(function () {
            var app = angular.module('app', ['server'])
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


            angular.mock.module('app');
        });

        beforeEach(inject(function (_$rootScope_, _$httpBackend_, _$componentController_) {
            $httpBackend = _$httpBackend_;
            $componentController = _$componentController_;
            $scope = _$rootScope_.$new();

        }));

        after(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });


        it('Should trigger a Idle event after the http loads ok - 1000ms', function (done) {
            $httpBackend.when('GET', '/someInexistantValue').respond({});
            $httpBackend.when('GET', '/big.json').respond(window.bigJSON);
            var jsonLoaded = false;

            window.addEventListener('Idle', function (event) {

                expect(jsonLoaded).to.be.ok;
                done();
            });

            var ctrl = $componentController('appComponent');

            setTimeout(function () {
                $httpBackend.flush();
                jsonLoaded = true;
                $scope.$digest();
                expect(ctrl.list.length).to.eql(window.bigJSON.length);
            }, 1000);

        });

    });

    describe('Filters', function () {

        var nbIterations = 1000;
        beforeEach(function () {
            var app = angular.module('filterApp', ['server'])
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

            angular.mock.module('filterApp');
        });

        var $filter, $componentController, $httpBackend, $rootScope;

        beforeEach(inject(function (_$filter_, _$componentController_, _$httpBackend_, _$rootScope_) {
            $filter = _$filter_;
            $componentController = _$componentController_;
            $httpBackend = _$httpBackend_;
            $rootScope = _$rootScope_.$new();

        }));

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('It should catch Idle event once the dates are $filtered', function (done) {

            window.addEventListener('Idle', function (event) {
                //console.info('test','test', 'LENGTH = ',ctrl.dates.length);
                expect(ctrl.dates.length).to.equal(nbIterations);
                done();
            });

            var ctrl = $componentController('appComponent');
            $httpBackend.when('GET', '/someInexistantValue').respond({});
            $httpBackend.flush();
            $rootScope.$digest();

            ctrl.bigFilter();
            $rootScope.$digest();


        })
    });


});
