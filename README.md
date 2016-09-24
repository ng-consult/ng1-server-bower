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
   
#Some config Providers

**cacheFactoryConfig**

```javascript
    cacheFactoryConfig.setDefaultCache(boolean)
```

This will tell your app to subsequently **continue** or **stop** caching the $http requests after they have been re-played on page load.

**timeoutValue**

```javascript
    timeoutValue.set(100);
```

Internally, this module check with a default interval of `200ms` when `$digest`, `$http` & `$q` are resolved.
It is possible to change it at run time, but it should be used only for debugging/development goals.
  

#contributing


```
npm i
bower install
npm run build
npm test
```