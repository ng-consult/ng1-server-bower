var be = before(window);

var jsonValue = {name: 'value'};
var tpl = "<span>test</span>";
var restURL = 'http://resturl.com:12345';

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

            $timeout.flush(serverConfig.getTimeoutValue());
        });

        it('It should throw an Idle Event', function(done) {

            var ctrl = $componentController('appComponent');

            var idleTriggered = false;

            window.addEventListener('Idle', function (event) {
                idleTriggered = true;
                done();
            });

            $timeout.flush(serverConfig.getTimeoutValue());

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
            $timeout.flush(serverConfig.getTimeoutValue());
        });

        it('Idle event should be thrown with a timeoutValue of 2000' , function(done) {
            serverConfig.setTimeoutValue(2000);
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
            be.noServer('server', {serverConfig: {
                clientTimeoutValue: 500
            }});
            be.injectNoServer();
        });

        it('Should get the timeoutValue from the window.clientTimeoutValue', function() {
            expect(serverConfig.getTimeoutValue()).to.eql(500);
            $timeout.flush(serverConfig.getTimeoutValue());

        });
    });

    describe('Log: debug = false', function() {

        beforeEach(function() {
            be.noServer('server', {
                serverConfig: {
                    debug: false
                }
            });

            be.injectNoServer()
        });

        var msg = 'test';

        ['log', 'warn', 'info', 'debug', 'error'].forEach(function(log) {
            it('Should display ONE $log.'+log, function() {
                $log[log].apply(window, [msg]);

                console.log($log[log].logs);
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

    describe('Log: debug = true', function() {

        beforeEach(function() {
            be.global();
            be.noServer('server', {serverConfig: {debug: true}});
            be.injectNoServer();
            serverConfig.init();
        });

        var msg = 'test';

        ['log', 'warn', 'info', 'error'].forEach(function(log) {
            it('Should display ONE $log.' + log, function() {
                $log[log].apply(window, [msg]);
                expect($log[log].logs.length).to.eql(1);
                expect($log[log].logs[0][0]).to.eql(msg);
            });
        });

        var nbDevLogs ;

        it('$log.dev should trigger debug', function() {

            nbDevLogs = $log['debug'].logs.length;

            $log.dev('name', 'something');

            expect($log['debug'].logs.length).to.eql(nbDevLogs + 1);

        });


    });


    describe('No REST URL defined', function() {
        var app = angular.module('appNoServerNoRest', ['server']).component('appComponent', {
            templateUrl: '/template.html',
            controller: function ($http) {
                var ctrl = this;
                this.list = null;
                this.error = null;
                $http.get('/something.json').then(function (list) {
                    ctrl.list = list.data;
                }, function (err) {
                    ctrl.error = err.status;
                });
            },
            bindings: {}
        });

        beforeEach(function() {
            be.global();
            be.noServer('appNoServerNoRest', {serverConfig: {}});
            be.injectNoServer()
        });


        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('$http should query the specified URL', function(done) {

            var ctrl = $componentController('appComponent');

            window.addEventListener('Idle', function (event) {
                done();
            });

            expect(ctrl.list).to.eql(null);

            $httpBackend.when('GET', '/template.html').respond(200, tpl);
            $httpBackend.when('GET', '/something.json').respond(200, jsonValue);
            $httpBackend.flush();
            expect(ctrl.list).to.eql(jsonValue);

            $timeout.flush(serverConfig.getTimeoutValue() );
        });

        it('The template should load OK trough the REST URL', function() {

            $httpBackend.when('GET', '/template.html').respond(200, tpl);
            $httpBackend.when('GET', '/something.json').respond(200, jsonValue);

            var scope = $rootScope.$new();
            var element = angular.element('<app-component></app-component>');
            element = $compile(element)(scope);

            $httpBackend.flush();

            expect( element[0].innerHTML).eql(tpl);

        });

    });

    describe('With REST URL defined & restCacheEnabled = true', function() {

        var app = angular.module('appNoServerREST', ['server']).component('appComponent', {
            templateUrl: "template.html",
            controller: function ($http) {
                var ctrl = this;
                this.list = null;
                this.error = null;
                $http.get('something.json').then(function (list) {
                    ctrl.list = list.data;
                }, function (err) {
                    ctrl.error = err.status;
                });
            },
            bindings: {}
        });

        beforeEach(function() {
            be.global();
            be.noServer('appNoServerREST', {
                serverConfig: {
                    restCacheEnabled: true,
                    restServerURL: restURL
                }
            });
            be.injectNoServer()
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('IDLE is triggered correctly', function(done) {
            $componentController('appComponent');

            window.addEventListener('Idle', function (event) {
                done();
            });

            $httpBackend.when('GET', restURL + '/get?url=' + encodeURIComponent('template.html')).respond(200, tpl);
            $httpBackend.when('GET', restURL + '/get?url=' + encodeURIComponent('something.json')).respond(200, jsonValue);
            $httpBackend.flush();

            $timeout.flush(serverConfig.getTimeoutValue() );
        });

        it('$http loads the JSON URL trough the REST cache proxy', function() {

            var ctrl = $componentController('appComponent');

            expect(ctrl.list).to.eql(null);

            $httpBackend.when('GET', restURL + '/get?url=' + encodeURIComponent('template.html')).respond(200, tpl);
            $httpBackend.when('GET', restURL + '/get?url=' + encodeURIComponent('something.json')).respond(200, jsonValue);
            $httpBackend.flush();
            expect(ctrl.list).to.eql(jsonValue);

        });

        it('The template should load trough the REST cache proxy', function() {

            $httpBackend.when('GET', restURL + '/get?url=template.html').respond(200, tpl);
            $httpBackend.when('GET', restURL + '/get?url=something.json').respond(200, jsonValue);

            var scope = $rootScope.$new();
            var element = angular.element('<app-component></app-component>');
            element = $compile(element)(scope);

            $httpBackend.flush();

            expect( element[0].innerHTML).eql(tpl);

        });

    });

});
