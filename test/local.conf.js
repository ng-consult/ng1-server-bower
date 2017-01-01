
var before = function (global) {
    return {
        global: function(override) {
            global.onServer = true;
            global.serverDebug = global.onTRAVIS ? false: true;
            global.ServerConfig = {
                socketServerURL: 'http://localhost:8882',
                restServerURL: 'http://domain.com'
            };
            if(override) {
                for(var key in override) {
                    if(typeof global[key] === 'undefined') {
                        global[key] = override[key];
                    } else {
                        global[key] = Object.assign({}, global[key], override[key]);
                    }
                }
            }
        },
        server: function (appName, override) {
            this.global(override);
            global.angular.mock.module(appName);
        },
        noServer: function (appName, override) {
            delete global.onServer;
            delete global.ServerConfig;
            delete global.ngServerCache;
            if(override) {
                for(var key in override) {
                    if(typeof global[key] === 'undefined') {
                        global[key] = override[key];
                    } else {
                        global[key] = Object.assign({}, global[key], override[key]);
                    }
                }
            }
            global.angular.mock.module(appName);
        },
        FN_ARGS: /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
        FN_ARG_SPLIT: /,/,
        FN_ARG: /^\s*(_?)(.+?)\1\s*$/,
        STRIP_COMMENTS: /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
        annotateInject:  function annotate(func) {
            return (func + '')
                .replace(/[/][/].*$/mg,'') // strip single-line comments
                .replace(/\s+/g, '') // strip white space
                .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
                .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
                .replace(/=[^,]+/g, '') // strip any ES6 defaults
                .split(',').filter(Boolean); // split & filter [""]
        },
        injectServer: function () {
            var fn = function(_$timeout_, _$componentController_, _$httpBackend_, _$cacheFactory_, _socket_, _serverConfigHelper_, _$rootScope_, _counter_, _$q_, _$log_, _$exceptionHandler_, _$filter_) {
                var i, tmp;
                for(i in arguments) {
                    tmp = myargs[i].replace(/^_/, '').replace(/_$/, '');
                    global[tmp] = arguments[i];
                }
                return global;
            };
            myargs = this.annotateInject(fn);
            return global.angular.mock.inject.apply(global, [fn]);
        },
        injectNoServer: function () {
            var fn = function(_$componentController_, _$httpBackend_, _$compile_, _$rootScope_, _$log_,  _$timeout_, _serverConfigHelper_) {
                var i, tmp;
                for(i in arguments) {
                    tmp = myargs[i].replace(/^_/, '').replace(/_$/, '');
                    global[tmp] = arguments[i];
                }
                return global;
            };
            myargs = this.annotateInject(fn);
            return global.angular.mock.inject.apply(global, [fn]);
        }
    }
};
