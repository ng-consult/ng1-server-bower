describe("cache Factory Decorator - window.onServer = true", function () {

    var be = before(window);

    var uid = 123;

    beforeEach(function() {
        be.server('server', {serverConfig: {uid: uid}});
        be.injectServer();
    });


    it('$window.$cacheFactoryProvider should  be set', function() {
        expect(serverConfig.hasRestCache()).eql(false);
    });


    describe('The original cache works ok', function() {

        it('Should have a cacheFactory decorator', function() {
            expect($cacheFactory).to.be.defined;
        });

        it('We can create a cache', function() {
            var newCache = $cacheFactory('test');
            expect(newCache).to.be.defined;
            expect(newCache).to.eql($cacheFactory.get('test'))
        });

        it('We can store , get size info, retrieve content and delete content', function() {
            let newCache, info, value;

            //Creation
            newCache = $cacheFactory('test');
            expect(newCache).to.be.defined;
            expect(newCache).to.eql($cacheFactory.get('test'));
            info = newCache.info();
            expect(info.id).to.eql('test');

            //storage
            newCache.put('a', 'b');
            info = newCache.info();
            expect(info.size).to.eql(1);

            //retrieval
            value = newCache.get('a');
            expect(value).to.eql('b');

            //removal
            newCache.remove('a');
            info = newCache.info();
            expect(info.size).to.eql(0);

            //retrieval of an unexistant value
            value = newCache.get('a');
            expect(value).to.be.undefined;

            //removeAll
            newCache.put('a', 1);
            newCache.put('b', 1);
            newCache.removeAll();
            info = newCache.info();
            expect(info.size).to.eql(0);

        });


    });

    describe('Augmented cache', function() {


        it('$cacheFactory.export()', function() {
            var cacheName = '$http';
            var key = 'someApiUrl';
            var value = { key: 'test' };

            var newCache = $cacheFactory(cacheName);
            expect(newCache).to.eql($cacheFactory.get(cacheName));

            expect(typeof newCache.put).to.eql('function');

            newCache.put(key, value);

            var data = $cacheFactory.export(cacheName);

            expect(data[key]).to.eql(value);

        });

        it('$cacheFactory.export() with an inexistant cache', function() {
            expect(function(){$cacheFactory.export('blahblah')}).to.throwError;
        });



        it('$cacheFactory.exportAll()', function() {
            var cacheNames = ['$http', '$someOther'];
            var key = 'someApiUrl';
            var value = { key: 'test' };

            cacheNames.forEach(function(cacheName) {
                var newCache = $cacheFactory(cacheName);
                newCache.put(key, value);
            });

            var data = $cacheFactory.exportAll();

            expect(Object.keys(data)).to.eql(cacheNames);

            for(var cache in data) {
                expect(data[cache][key]).to.eql(value);
            }

        });

        it('$cacheFactory.import() merge with existing data', function() {

            var cacheName = '$http';
            var dataToImport = {
                'key1': 'value1',
                'key2': 'value2'
            };
            var existingData = {
                'key3': 'value3'
            };

            var newCache = $cacheFactory(cacheName);
            newCache.put('key3', existingData.key3);

            $cacheFactory.import(cacheName, dataToImport);

            expect($cacheFactory.export(cacheName)).to.eql(Object.assign(existingData, dataToImport));

        });

        it('$cacheFactory.import() overrides existing data', function() {

            var cacheName = '$http';
            var dataToImport = {
                'key1': 'value1',
                'key2': 'value2'
            };
            var existingData = {
                'key1': 'value3'
            };

            var newCache = $cacheFactory(cacheName);
            newCache.put('key1', existingData.key3);

            $cacheFactory.import(cacheName, dataToImport);

            expect($cacheFactory.export(cacheName)).to.eql(dataToImport);

        });

        it('$cacheFactory.importAll() with cache inexistant', function() {

            var dataToImport = {
                '$http': {
                    'key1': 'value1',
                    'key2': 'value2'
                },
                '$template': {
                    'key3': 'value3',
                    'key4': 'value4'
                }
            };

            $cacheFactory.importAll(dataToImport);

            expect($cacheFactory.exportAll()).to.eql(dataToImport);

        });

        it('$cacheFactory.importAll() with cache already defined', function() {

            var cacheNames = ['$http', '$template'];

            var dataToImport = {
                '$http': {
                    'key1': 'value1',
                    'key2': 'value2'
                },
                '$template': {
                    'key3': 'value3',
                    'key4': 'value4'
                }
            };

            cacheNames.forEach(function(cacheName) {
                var newCache = $cacheFactory(cacheName);
            });

            $cacheFactory.importAll(dataToImport);

            expect($cacheFactory.exportAll()).to.eql(dataToImport);

        });

    });

});
