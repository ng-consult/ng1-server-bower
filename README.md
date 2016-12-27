#angular.js-server    [![Build Status](https://travis-ci.org/a-lucas/angular.js-server-bower.svg?branch=master)](https://travis-ci.org/a-lucas/angular.js-server-bower)   [![codecov](https://codecov.io/gh/a-lucas/angular.js-server-bower/branch/master/graph/badge.svg)](https://codecov.io/gh/a-lucas/angular.js-server-bower)

This is the client module to include to make [Angular.js-server]( https://github.com/a-lucas/angular.js-server/ "Angular.js on server") work.

#installation

As simple as that: 
```
bower install angular.js-server
```

If you still don't use [bower](), you can get the file [here]()

Then include the dependency `server`.
```
angular.module('your-app', ['server']);
```

# What does it do?

It decorates several angular native providers: 
- $http
- $cacheFactory
- $q
- $exceptionHandler
- $log
- $templateCache

There is nothing to change in your angular app, except for the `server` the dependecy. 

# $log.dev

After `log, debug, error, warn, info` you get `$log.dev()`.
 
 If `window.serverConfig.debug` is equal to `true`, it will log debugging information relative to the IDLE detection, this is very verbose, and should not be used on production.
  
 Only usefull if you are working on contributing to this package - or if you want to develop your own debugging tool inside Angular.
 



#How is the Idle status of the page detected?
 
The `Idle` event is sent on page load, and it is sent only once, when **all** these conditions are met: 
  
-   The $digest() is idle
-   All $http calls are resolved
-   All promises are resolved

#How about the REST caching functionality?

If detected, `$cacheFactory` will preload all the cached data ($http results, and templates) and will replay them instantly

#What else?

- It decorate the Exception Handler to send a `ServerExceptionHandler `Event for server side loggin purposes
- Uses the $log server config data to write on the server file system when the angular app is loaded on the server side
- It adds a $log.dev() method for debugging purposes 
   
#Some config Data

Uses the Factory `serverConfig` inside the `run()`.
 
```javascript

angular.module('your-app', [])
    .run(function(serverConfig) {
    
        serverConfig.setRestServer('http:/wwwww.yourdomain.com');
    
    });

```

 
**setRestServer(url: string)**

eEnables the server side REST caching, by forwarding all $http calls and template calls to this proxy URL.

This specific scenario works even if the server side page rendering is disabled.
 
**setTimeoutValue(time: number)**

Internally, this module check with a default interval of `200ms` when `$digest`, `$http` & `$q` are resolved.
It is possible to change it at run time, but it should be used only for debugging/development goals.


**setDefaultHtpCache(cache: boolean)**

This will tell your app to subsequently **continue** or **stop** caching the $http requests after they have been re-played on page load.

This setting is only effective when the page has been server pre-rendered.

#contributing


```
npm i
bower install
npm run build
npm test
```
