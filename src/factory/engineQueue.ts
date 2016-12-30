import {IEngineQueue, IServerConfig} from './../interfaces/definitions';

const EngineQueue = ($log, $rootScope, $window: Window, $cacheFactory, socket, serverConfigHelper: IServerConfig): IEngineQueue => {

    const doneVar = {};

    const dependencies = {};
    const addDependency = (url: string, cacheId: string) => {
        if(typeof dependencies[cacheId] === 'undefined') {
            dependencies[cacheId] = [];
        }
        dependencies[cacheId].push(url);
    };

    $window['ngIdle'] = false;
    $rootScope.exception = false;

    //makes sure that when an exception occurs, the IDLE state is NOT triggered
    $window.addEventListener('ExceptionHandler', () => {
        $rootScope.exception = true;
    });

    const setStatus = function(name: string, value: boolean) {
        if(isDone) {
            //$log.dev('EngineQueue', name, value, 'EngineQueue is now inactive - you cant use it anymore');
            return;
        }
        doneVar[name] = value;
        if (value === true) {
            done(name);
        }
    };

    let isDone = false;

    const areDoneVarAllTrue = (): boolean => {
        for(var key in doneVar) {
            if(!doneVar[key]) { return false;}
        }
        return true;
    };

    const getExportedCache = () => {
        const exportedCache = {};

        for(let cacheId in dependencies) {
            exportedCache[cacheId] = {};
            const cachedUrls = $cacheFactory.export(cacheId);

            dependencies[cacheId].forEach( (cachedUrl:string) => {
                if(serverConfigHelper.getRestCacheEnabled()) {
                    exportedCache[cacheId][cachedUrl] = cachedUrls[cachedUrl];
                } else {
                    //extract original URL
                    const cacheServerURL = serverConfigHelper.getRestServer() + '/get?url=';

                    if(cachedUrl.indexOf(cacheServerURL) === 0) {
                        let decodedCachedUrl = decodeURIComponent(cachedUrl.replace(cacheServerURL, ''));
                        exportedCache[cacheId][decodedCachedUrl] = cachedUrls[cachedUrl];
                    } else {
                        throw new Error('Something unlogical hapens here');
                    }
                }

            });
        }
        return exportedCache;
    };


    const done = (from?:string): boolean => {
        $log.dev('engineQueue.isDone()', from, doneVar);
        if(isDone) {
            return isDone;
        }
        if(areDoneVarAllTrue() && $rootScope.exception === false) {
            isDone = true;

            $window['ngIdle'] = true;

            if(serverConfigHelper.onServer() === true) {

                //todo uncomment this
                //console.log('GOing to throw an error');
                //throw new Error('testerror');

                let doctype;

                try {
                    doctype = new XMLSerializer().serializeToString(document.doctype)
                } catch(e) {
                    // There is no doctype definition.
                    $log.warn('There is no doctype associated to this document');
                    doctype = '';
                }
                socket.emit('IDLE', {
                    html: document.documentElement.outerHTML,
                    doctype: doctype,
                    url: window.location.href,
                    exportedCache: getExportedCache()
                });

                socket.on('IDLE'+ serverConfigHelper.getUID(), function() {
                    const Event = $window['Event'];
                    const dispatchEvent = $window.dispatchEvent;
                    const IdleEvent = new Event('Idle');
                    dispatchEvent(IdleEvent);
                    $rootScope.$broadcast('InternIdle');

                });
            } else {
                if (serverConfigHelper.hasRestCache() && serverConfigHelper.getDefaultHttpCache() === false) {
                    //console.log('deleting $http', serverConfigHelper.getDefaultHttpCache());
                    $cacheFactory.delete('$http');
                }
                const Event = $window['Event'];
                const dispatchEvent = $window.dispatchEvent;
                const IdleEvent = new Event('Idle');
                dispatchEvent(IdleEvent);
                $rootScope.$broadcast('InternIdle');

            }
        }
        return isDone;
    };

    return {
        isDone: done,
        setStatus: setStatus,
        addDependency: addDependency
    };
};

export default EngineQueue;