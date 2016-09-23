
var before = function (global) {
    return {
        global: function(override) {
            global.files = {};
            global.onServer = true;
            global.serverDebug = global.onTRAVIS ? false: true;
            global.fs = {
                appendFile: function (path, msg, cb) {
                    global.files[path] = msg;
                }
            };
            global.logConfig = {
                dir: '/var/log/angular',
                warn: {
                    enabled: true,
                    stack: false
                },
                log: {
                    enabled: true,
                    stack: false
                },
                debug: {
                    enabled: false,
                    stack: false
                },
                error: {
                    enabled: true,
                    stack: false
                },
                info: {
                    enabled: false,
                    stack: false
                }
            };
            if(override) {
                for(var key in override) {
                    global[key] = override[key];
                }
            }
        },
        server: function (appName, override) {
            this.global(override);
            global.angular.mock.module(appName);
        },
        noServer: function (appName, override) {
            delete global.onServer;
            delete global.fs;
            delete global.logConfig;
            delete global.$cacheFactory;

            if(override) {
                for(var key in override) {
                    global[key] = override[key];
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

            var fn = function(_$timeout_, _$componentController_, _$httpBackend_, _$cacheFactory_, _cacheFactoryConfig_, _$rootScope_, _counter_, _$q_, _$log_, _$exceptionHandler_, _$filter_, _timeoutValue_) {
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
            var fn = function(_$componentController_, _$log_,  _$timeout_, _timeoutValue_) {
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

console.log(window.before(window).server);