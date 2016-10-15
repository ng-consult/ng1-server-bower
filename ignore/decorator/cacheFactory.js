'use strict';
var CacheData = (function () {
    function CacheData(name) {
        var _this = this;
        this.name = name;
        this.set = function (key) {
            _this.data[key] = Date.now();
        };
        this.has = function (key) {
            return typeof _this.data[key] !== 'undefined';
        };
        this.delete = function (key) {
            if (_this.has(key)) {
                delete _this.data[key];
            }
        };
        this.keys = function () {
            return _this.data;
        };
        this.empty = function () {
            _this.data = {};
        };
        this.data = {};
    }
    return CacheData;
}());
exports.CacheFactory = function ($delegate) {
    var caches = {};
    function getCacheFactory() {
        var $cacheFactory = function (cacheId, options) {
            var cache;
            try {
                cache = $delegate(cacheId, options);
            }
            catch (e) {
                cache = $delegate.get(cacheId);
            }
            var Oput = cache.put;
            var Oremove = cache.remove;
            cache.put = function (key, value) {
                caches[cacheId].set(key);
                Oput.apply(cache, [key, value]);
            };
            cache.remove = function (key) {
                caches[cacheId].delete(key);
                Oremove.apply(cache, [key]);
            };
            caches[cacheId] = new CacheData(cacheId);
            return cache;
        };
        $cacheFactory.prototype = $delegate.prototype;
        $cacheFactory.export = function (cacheId) {
            if (typeof caches[cacheId] === 'undefined') {
                throw new Error('$cacheFactory - iid - CacheId ' + cacheId + ' is not defined!');
            }
            var data = {};
            var cache = caches[cacheId];
            var storedCache = $delegate.get(cacheId);
            var keys = cache.keys();
            for (var key in keys) {
                data[key] = storedCache.get(key);
            }
            return data;
        };
        $cacheFactory.exportAll = function () {
            var data = {};
            for (var cacheId in caches) {
                data[cacheId] = $cacheFactory.export(cacheId);
            }
            return data;
        };
        $cacheFactory.import = function (cacheId, data) {
            if (typeof caches[cacheId] === 'undefined') {
                $cacheFactory(cacheId, {});
            }
            var storedCache = $delegate.get(cacheId);
            for (var key in data) {
                storedCache.put(key, data[key]);
            }
        };
        $cacheFactory.importAll = function (data) {
            for (var key in data) {
                $cacheFactory.import(key, data[key]);
            }
        };
        $cacheFactory.delete = function (cacheId) {
            if (typeof caches[cacheId] !== 'undefined') {
                var storedCache = $delegate.get(cacheId);
                storedCache.removeAll();
                storedCache.destroy();
                delete caches[cacheId];
            }
        };
        $cacheFactory.get = $delegate.get;
        $cacheFactory.info = $delegate.info;
        return $cacheFactory;
    }
    return getCacheFactory();
};
exports.TemplateCache = function ($cacheFactory) {
    return $cacheFactory('templates');
};
var CacheFactoryConfig = (function () {
    function CacheFactoryConfig() {
        var _this = this;
        this.$get = function () {
            return {
                setDefaultCache: function (value) {
                    _this.defaultCache = value;
                },
                getDefaultCache: function () {
                    return _this.defaultCache;
                }
            };
        };
        this.defaultCache = true;
    }
    return CacheFactoryConfig;
}());
exports.CacheFactoryConfig = CacheFactoryConfig;
