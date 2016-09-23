'use strict';

interface mapData {
    [any: string]: number
}

interface CacheDataCollection<T> {
    [any: string]: CacheData<T>
}

class CacheData<T> {

    private data: mapData;
    constructor(public name: string) {
        this.data = {};
    }

    /**
     * Store the storage timestamp for this cached data
     * @param key
     */
    set = (key: string) => {
        this.data[key] = Date.now();
    };

    has = (key:string): boolean => {
        return typeof this.data[key] !== 'undefined';
    };

    delete = (key:string) => {
        if(this.has(key)) {
            delete this.data[key];
        }
    };

    keys = (): mapData => {
        return this.data;
    };

    empty = (): void => {
        this.data = {};
    };
}

export const CacheFactory = ($delegate) => {

    let caches: CacheDataCollection<any> =  {};
    
    let $cacheFactory = function(cacheId: string, options) {

        let cache;
        try{
            cache = $delegate(cacheId, options);
        }
        catch(e) {

            cache = $delegate.get(cacheId);
        }

        const Oput = cache.put;
        const Oremove = cache.remove;

        cache.put = (key: any, value: any) => {
            caches[cacheId].set(key);
            Oput.apply(cache, [key, value]);
        };

        cache.remove = (key: string) => {
            caches[cacheId].delete(key);
            Oremove.apply(cache, [key]);
        };

        caches[cacheId] = new CacheData(cacheId);

        return cache;

    }

    $cacheFactory.prototype = $delegate.prototype;

    $cacheFactory.export = (cacheId: string): mapData => {
        if (typeof caches[cacheId] === 'undefined' ) {
            throw new Error('$cacheFactory - iid - CacheId '+cacheId+' is not defined!');
        }
        const data = {};

        const cache = caches[cacheId];
        const storedCache = $delegate.get(cacheId);
        const keys =  cache.keys();

        for(var key in keys) {
            data[key] = storedCache.get(key);
        }
        return data;
    };

    $cacheFactory.exportAll = () => {
        var data = {};
        for(var cacheId in caches) {
            data[cacheId] = $cacheFactory.export(cacheId);
        }
        return data;
    };

    $cacheFactory.import = (cacheId:string, data: mapData): void => {
        if (typeof caches[cacheId] === 'undefined' ) {
            $cacheFactory(cacheId, {});
        }
        const storedCache = $delegate.get(cacheId);

        for(var key in data) {
            storedCache.put(key, data[key]);
        }
    };

    $cacheFactory.importAll = (data): void => {
        for(var key in data) {
            $cacheFactory.import(key, data[key]);
        }
    };

    $cacheFactory.delete = (cacheId: string): void => {
        if (typeof caches[cacheId] !== 'undefined' ) {
            const  storedCache = $delegate.get(cacheId);
            storedCache.removeAll();
            storedCache.destroy();
            delete caches[cacheId];
        }
    }
    $cacheFactory.get = $delegate.get;
    $cacheFactory.info = $delegate.info;

    return $cacheFactory;
};


export const TemplateCache = ($cacheFactory) => {

    return $cacheFactory('templates');

};



export class CacheFactoryConfig {
    private defaultCache;
    constructor() {
        this.defaultCache = true;
    }

    $get = () => {
        return {
            setDefaultCache: (value:boolean):void => {
                this.defaultCache = value;
            },
            getDefaultCache: ():boolean => {
                return this.defaultCache;
            }
        }

    }
}