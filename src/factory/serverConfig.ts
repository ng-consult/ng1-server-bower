
const ServerConfigFactory = ()  => {

    let initialized: boolean = false;

    let httpCache: boolean = true;
    let restServer: string = null;
    let restCacheEnabled: boolean = false;
    let timeoutValue: number = 200;
    let server: boolean = false;
    let uid: string = null;
    let socketServer: string = null;
    let restCache: any = null;
    let debug: boolean = false;

    //initialize
    const init = (): void => {
        //console.log(window['serverConfig']);

        if (initialized) return;
        initialized = true;
        if(angular.isDefined(window['onServer']) && window['onServer'] === true) {
            server = true;
        }
        if (angular.isDefined(window['ServerConfig'])) {
            if(angular.isDefined(window['ServerConfig'].clientTimeoutValue)) {
                timeoutValue = window['ServerConfig'].clientTimeoutValue;
            }
            if(angular.isDefined( window['ServerConfig'].restServerURL)) {
                restServer = window['ServerConfig'].restServerURL;
            }
            if(angular.isDefined( window['ServerConfig'].uid)) {
                uid = window['ServerConfig'].uid;
            }
            if(angular.isDefined( window['ServerConfig'].socketServerURL)) {
                socketServer = window['ServerConfig'].socketServerURL;
            }
            if(angular.isDefined( window['ngServerCache'])) {
                restCache = window['ngServerCache'];
            }
            if(angular.isDefined( window['ServerConfig'].debug)) {
                debug = window['ServerConfig'].debug;
            }
            if(angular.isDefined( window['ServerConfig'].httpCache)) {
                //console.log('LOADING HTTPCACHE ', window['ServerConfig']);
                httpCache = window['ServerConfig'].httpCache;
            }
            if(angular.isDefined( window['ServerConfig'].restCache)) {
                restCacheEnabled = window['ServerConfig'].restCache;
            }
        }

        //Some validation:

        if ( server && ( socketServer === null || /*restServer === null ||*/ uid === null) ) {
            console.error(JSON.stringify(window['ServerConfig']));
            throw new Error('invalid serverConfig: uid, socketServer missing ');
        }
    };

    const hasRestCache = (): boolean => {
        return restCache !== null;
    };

    const hasPreBoot = (): boolean => {
        return typeof window['preboot'] !== 'undefined'
            && typeof window['preboot'].complete === 'function'
            && onServer() === false
            && typeof window['prebootstrap'] === 'function';
    };

    const preBootComplete = (): void => {
        window['preboot'].complete();
    };

    const onServer = (): boolean => {
        return server;
    };

    const getDebug = (): boolean => {
        return debug;
    };

    const getDefaultHttpCache = ():boolean => {
        return httpCache;
    };

    const getRestCacheEnabled = ():boolean => {
        return restCacheEnabled;
    };

    const getRestServer = ():string => {
        return restServer;
    };

    const getSocketServer = (): string => {
        return socketServer;
    };

    const getTimeoutValue = ():number => {
        return timeoutValue;
    };

    const getUID = ():string => {
        return uid;
    };

    const getRestCache = (): boolean => {
        return restCache;
    };

    //Setters
    const setDefaultHtpCache = (value:boolean):void => {
        httpCache = value;
    };

    const setRestServer = (value:string):void => {
        restServer = value;
    };

    const setTimeoutValue = (value:number):void => {
        timeoutValue = value;
    };

    return {
        init,
        hasRestCache,
        hasPreBoot,
        onServer,
        getDebug,
        getDefaultHttpCache,
        getRestCache,
        getRestCacheEnabled,
        getRestServer,
        getSocketServer,
        getTimeoutValue,
        getUID,
        setDefaultHtpCache,
        setRestServer,
        setTimeoutValue,
        preBootComplete
    };
}


export default ServerConfigFactory;