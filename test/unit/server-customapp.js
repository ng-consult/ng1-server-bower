
describe('Server side Enabled - Custom app definition', function() {


    var files = {};

    beforeEach(function() {
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

    });


    describe('A ng-model gets updated app', function () {
        var $componentController, $httpBackend, $rootScope;

        beforeEach(function () {
            var app = angular.module('appNgModel', ['server'])
                .component('appComponent', {
                    template: "<input type='text' ng-model='item'/>",
                    controller: function () {
                        var ctrl = this;
                        this.item = 'text';
                    },
                    bindings: {}
                });
            angular.mock.module('appNgModel');
        });

        beforeEach(inject(function (_$componentController_, _$rootScope_, _$httpBackend_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $httpBackend = _$httpBackend_;

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
            $httpBackend.when('GET', '/someInexistantValue').respond({});
            $httpBackend.flush();
            $rootScope.$digest();

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
            $httpBackend.when('GET', '/someInexistantValue').respond({});
            $httpBackend.flush();
            $rootScope.$digest();


            for (var i = 0; i < 1000; i++) {
                ctrl.item = 'changed' + i;
                modelChangedCount++;
                $rootScope.$digest();
            }
            expect(ctrl.item).to.eql('changed999');
        });

    });

    describe('Component app that loads a failed reuqest', function() {
        var $httpBackend,
            $componentController,
            $rootScope;

        beforeEach(function () {
            var app = angular.module('appJSON', ['server'])
                .component('appComponent', {
                    template: "<div ng-repeat='item in $ctrl.list'><input type='text' ng-model='item'></div>",
                    controller: function ($http) {
                        var ctrl = this;
                        this.list = [];
                        this.error1;
                        this.error2;
                        this.getList = function () {
                            $http.get('/big.json').then(function (list) {
                                ctrl.list = list.data;
                            }, function(err) {
                                ctrl.error1 = err.status;
                            });
                        };

                    },
                    bindings: {}
                });


            angular.mock.module('appJSON');
        });

        beforeEach(inject(function (_$rootScope_, _$httpBackend_, _$componentController_) {
            $httpBackend = _$httpBackend_;
            $componentController = _$componentController_;
            $rootScope = _$rootScope_.$new();

        }));

        after(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });


        it('Should trigger a Idle event after the http loads ok - 1000ms', function (done) {
            var jsonFailed = false;
            $httpBackend.when('GET', '/someInexistantValue').respond({});
            $httpBackend.flush();
            $rootScope.$digest();

            window.addEventListener('Idle', function (event) {
                expect(jsonFailed).to.be.ok;
                done();
            });
            
            var ctrl = $componentController('appComponent');

            $httpBackend.when('GET', '/big.json').respond(400, {});;
            ctrl.getList();
            $rootScope.$digest();

            setTimeout(function () {

                $httpBackend.flush();
                $rootScope.$digest();
                expect(ctrl.list.length).to.eql(0);
                expect(ctrl.error1).to.eql(400);
                jsonFailed = true;

            }, 1000);

        });
    });

    describe('Component App that loads a BIG json file', function () {
        var $httpBackend,
            $componentController,
            $rootScope;

        beforeEach(function () {
            var app = angular.module('appJSON', ['server'])
                .component('appComponent', {
                    template: "<div ng-repeat='item in $ctrl.list'><input type='text' ng-model='item'></div>",
                    controller: function ($http) {
                        var ctrl = this;
                        this.list = [];
                        this.getList = function() {
                            $http.get('/big.json').then(function (list) {
                                ctrl.list = list.data;
                            });
                        };

                    },
                    bindings: {}
                });


            angular.mock.module('appJSON');
        });

        beforeEach(inject(function (_$rootScope_, _$httpBackend_, _$componentController_) {
            $httpBackend = _$httpBackend_;
            $componentController = _$componentController_;
            $rootScope = _$rootScope_.$new();

        }));

        after(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });


        it('Should trigger a Idle event after the http loads ok - 1000ms', function (done) {
            var jsonLoaded = false;
            $httpBackend.when('GET', '/someInexistantValue').respond({});
            $httpBackend.flush();
            $rootScope.$digest();

            window.addEventListener('Idle', function (event) {
                expect(jsonLoaded).to.be.ok;
                done();
            });


            var ctrl = $componentController('appComponent');

            $httpBackend.when('GET', '/big.json').respond(window.bigJSON);
            ctrl.getList();
            $rootScope.$digest();

            setTimeout(function () {
                $httpBackend.flush();
                jsonLoaded = true;
                $rootScope.$digest();
                expect(ctrl.list.length).to.eql(window.bigJSON.length);
            }, 1000);

        });

    });

    describe('Filters', function () {

        var nbIterations = 1000;
        beforeEach(function () {
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

            angular.mock.module('appFilters');
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
