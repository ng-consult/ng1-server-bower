This is the client module to include in order to make the server side renderer work with your application ( https://github.com/a-lucas/angular.js-server/ )

#install

```
bower install angular.js-server
```


Then include the dependency `server`.
```
angular.module('your-app', ['server']);
```

#contributing


```
npm i
npm install -g typescript
npm link typescript
npm run build
```