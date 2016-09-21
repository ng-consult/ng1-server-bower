#angular.js-server-bower    [![Build Status](https://travis-ci.org/a-lucas/angular.js-server-bower.svg?branch=master)](https://travis-ci.org/a-lucas/angular.js-server-bower)   [![codecov](https://codecov.io/gh/a-lucas/angular.js-server-bower/branch/master/graph/badge.svg)](https://codecov.io/gh/a-lucas/angular.js-server-bower)


This is the client module to include to make the server side renderer work with your application ( https://github.com/a-lucas/angular.js-server/ )

#install

```
bower install angular.js-server
```


Then include the dependency `server`.
```
angular.module('your-app', ['server']);
```

# How does this module work?

There is nothing to change in your angular app. 

This module does severall things: 

    - Detect the Idle status of the angular app when all these conditions are met: sends an `Idle` Event
        -   The $digest() is idle
        -   All $http calls are resolved
        -   All promises are resolved
    - Augment the Exception Handler to send a `ServerExceptionHandler `Event to $window
    - Uses the $log server config data to write on the server file system when the angular app is loaded on the server side
    

#contributing


```
npm i
npm run bower
npm run build
npm test
```