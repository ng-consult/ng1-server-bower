var be = before(window);

describe("cache Factory Decorator - window.onServer = false, no data to import", function () {


    beforeEach(function() {
        be.noServer('server');
        be.injectServer();
    });

    it('The app should just work', function() {
        expect(true).to.be.ok
    });

    it('$window.$cacheFactory should not be set', function() {
        expect(window.$cacheFactory).to.be.defined;
    });

    it('$window.$angularServerCache should not be set', function() {
        expect(window.$angularServerCache).to.be.undefined;
    });

});


describe("cache Factory Decorator - window.onServer = false, cache data to import", function () {

    var data = {
        $http: {
            key: 'value'
        }
    };
    
    describe('General setting', function() {
        beforeEach(function() {
            be.noServer('server',{
                $angularServerCache: data
            });
            be.injectServer();
        });

        it('The app should just work', function() {
            expect(true).to.be.ok
        });

        it('$window.$cacheFactory should not be set', function() {
            expect(window.$cacheFactory).to.be.defined;
        });

        it('$window.$angularServerCache should be set', function() {
            expect(window.$angularServerCache).to.be.defined;
        });

        it('Should catch the idle event', function(done) {
            window.addEventListener('Idle', function(e) {
                expect(e).to.be.defined;
                done();
            });
            $timeout.flush(200);
        });

    });

    describe('With $http.defaults.cache = true', function() {

        beforeEach(function() {
            be.noServer('server',{
                $angularServerCache: data
            });
            be.injectServer();
        });


        it('The cache should be loaded ok', function() {
            expect(window.$angularServerCache).to.eql(data);

            expect($cacheFactory.exportAll()).to.eql(data);
        });

        it('After Idle, the cache should persist', function() {

            expect(window.$angularServerCache).to.eql(data);

            $timeout.flush(200);

            expect($cacheFactory.exportAll()).to.eql(data);

        });
    });

    describe('With $http.defaults.cache = false', function() {

        var app = angular.module('someApp', ['server']).config(function(cacheFactoryConfigProvider ){
            cacheFactoryConfigProvider.$get().setDefaultCache(false);
        });
        beforeEach(function() {
            be.noServer('someApp',{
                $angularServerCache: data
            });
            be.injectServer();
        });

        it('The cache should be loaded ok', function() {

            expect(cacheFactoryConfig.getDefaultCache()).to.eql(false);

            expect(window.$angularServerCache).to.eql(data);

            expect($cacheFactory.exportAll()).to.eql(data);
        });


        it('After Idle, the cache should not persist', function(done) {

            window.addEventListener('Idle', function(e) {
                expect(e).to.be.defined;
                done();
            });

            expect(window.$angularServerCache).to.eql(data);

            $timeout.flush(200);
            expect(cacheFactoryConfig.getDefaultCache()).to.eql(false);

        });
    });
});
