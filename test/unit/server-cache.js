var be = before(window);

describe("cache Factory Decorator - window.onServer = false, no data to import", function () {

    beforeEach(function() {
        be.noServer('server');
        be.injectServer();
    });

    it('The app should just work', function(done) {
        $rootScope.$on('InternIdle', function() {
            done();
        });
        $timeout.flush(serverConfig.getTimeoutValue());
    });

    it('serverConfig.hasRestCache() should be false.', function() {
        expect(serverConfig.hasRestCache()).eql(false);
    });

});


describe("cache Factory Decorator - window.onServer = false, cache data to import", function () {

    var data = {
        $http: {
            key: 'value'
        }
    };
    
    describe('With $http.defaults.cache = true', function() {
        beforeEach(function() {
            be.noServer('server',{
                ngServerCache: data,
                serverConfig: {httpCache: true}
            });
            be.injectServer();
        });

        it('The app should just work', function(done) {
            $rootScope.$on('InternIdle', function() {
                done();
            });
            $timeout.flush(serverConfig.getTimeoutValue());
        });

        it('serverConfig.hasRestCache() should be true.', function() {
            expect(serverConfig.hasRestCache()).eql(true);
        });

        it('The cacheFactory should have had imported the cached data', function() {
            expect($cacheFactory.exportAll()).eql(data);
        });

        it('After IDLE, the cache data should still be present', function(done) {
            $rootScope.$on('InternIdle', function() {
                expect($cacheFactory.exportAll()).eql(data);
                done();
            });
            $timeout.flush(serverConfig.getTimeoutValue());
        });

    });

    describe('With $http.defaults.cache = false', function() {

        beforeEach(function() {
            be.noServer('server',{
                ngServerCache: data,
                serverConfig: {httpCache: false}
            });
            be.injectServer();
        });



        it('The app should just work', function(done) {
            $rootScope.$on('InternIdle', function() {
                done();
            });
            $timeout.flush(serverConfig.getTimeoutValue());
        });

        it('serverConfig.hasRestCache() should be true.', function() {
            expect(serverConfig.hasRestCache()).eql(true);
        });

        it('The cacheFactory should have had imported the cached data', function() {
            expect($cacheFactory.exportAll()).eql(data);
        });


        it('After IDLE, the cache data should be empty', function(done) {
            $rootScope.$on('InternIdle', function() {
                expect($cacheFactory.exportAll()).eql({});
                done();
            });
            $timeout.flush(serverConfig.getTimeoutValue());
        });
    });

});
