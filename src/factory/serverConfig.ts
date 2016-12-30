
const ServerConfigFactory = ($window: Window)  => {

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
        //console.log($window['serverConfig']);

        if (initialized) return;
        initialized = true;
        if(angular.isDefined($window['onServer']) && $window['onServer'] === true) {
            server = true;
        }
        if (angular.isDefined($window['serverConfig'])) {
            if(angular.isDefined($window['serverConfig'].clientTimeoutValue)) {
                timeoutValue = $window['serverConfig'].clientTimeoutValue;
            }
            if(angular.isDefined( $window['serverConfig'].restServerURL)) {
                restServer = $window['serverConfig'].restServerURL;
            }
            if(angular.isDefined( $window['serverConfig'].uid)) {
                uid = $window['serverConfig'].uid;
            }
            if(angular.isDefined( $window['serverConfig'].socketServerURL)) {
                socketServer = $window['serverConfig'].socketServerURL;
            }
            if(angular.isDefined( $window['ngServerCache'])) {
                restCache = $window['ngServerCache'];
            }
            if(angular.isDefined( $window['serverConfig'].debug)) {
                debug = $window['serverConfig'].debug;
            }
            if(angular.isDefined( $window['serverConfig'].httpCache)) {
                //console.log('LOADING HTTPCACHE ', $window['serverConfig']);
                httpCache = $window['serverConfig'].httpCache;
            }
            if(angular.isDefined( $window['serverConfig'].restCache)) {
                restCacheEnabled = $window['serverConfig'].restCache;
            }
        }

        //Some validation:

        if ( server && ( socketServer === null || /*restServer === null ||*/ uid === null) ) {
            console.error($window['serverConfig']);
            throw new Error('invalid serverConfig: uid, socketServer missing ');
        }
    };

    const hasRestCache = (): boolean => {
        return restCache !== null;
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
        setTimeoutValue
    };
}


export default ServerConfigFactory;