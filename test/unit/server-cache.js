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
        $timeout.flush(serverConfigHelper.getTimeoutValue());
    });

    it('serverConfigHelper.hasRestCache() should be false.', function() {
        expect(serverConfigHelper.hasRestCache()).eql(false);
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
                serverConfig: {
                    httpCache: true,
                    restCache: false
                }
            });
            be.injectServer();
        });

        it('The app should just work', function(done) {
            $rootScope.$on('InternIdle', function() {
                done();
            });
            $timeout.flush(serverConfigHelper.getTimeoutValue());
        });

        it('serverConfigHelper.hasRestCache() should be true.', function() {
            expect(serverConfigHelper.hasRestCache()).eql(true);
        });

        it('serverConfigHelper.getRestCacheEnabled() should be false.', function() {
            expect(serverConfigHelper.getRestCacheEnabled()).eql(false);
        });

        it('The cacheFactory should have had imported the cached data', function() {
            expect($cacheFactory.exportAll()).eql(data);
        });

        it('After IDLE, the cache data should still be present', function(done) {
            $rootScope.$on('InternIdle', function() {
                expect($cacheFactory.exportAll()).eql(data);
                done();
            });
            $timeout.flush(serverConfigHelper.getTimeoutValue());
        });

    });

    describe('With $http.defaults.cache = false', function() {

        beforeEach(function() {
            be.noServer('server',{
                ngServerCache: data,
                serverConfig: {
                    httpCache: false,
                    restCache: false
                }
            });
            be.injectServer();
        });



        it('The app should just work', function(done) {
            $rootScope.$on('InternIdle', function() {
                done();
            });
            $timeout.flush(serverConfigHelper.getTimeoutValue());
        });

        it('serverConfigHelper.hasRestCache() should be true.', function() {
            expect(serverConfigHelper.hasRestCache()).eql(true);
        });

        it('The cacheFactory should have had imported the cached data', function() {
            expect($cacheFactory.exportAll()).eql(data);
        });

        it('serverConfigHelper.getRestCacheEnabled() should be false.', function() {
            expect(serverConfigHelper.getRestCacheEnabled()).eql(false);
        });

        it('After IDLE, the cache data should be empty', function(done) {
            $rootScope.$on('InternIdle', function() {
                expect($cacheFactory.exportAll()).eql({});
                done();
            });
            $timeout.flush(serverConfigHelper.getTimeoutValue());
        });
    });

});
