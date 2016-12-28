
module.exports = function () {
    return {
        basePath: './../',
        frameworks: ['mocha', 'chai', 'mocha-debug', 'sinon-chai', 'socket-io-server'],
        reporters: ['mocha', 'coverage'],
        browsers: ['Chrome'],

        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--headless']
            }
        },
        preprocessors: {
            '**/*.json': ['json'],
            'dist/ng1-server.js': ['coverage']
        },
        coverageReporter: {
            instrumenter: {
                '**/*.js': 'istanbul' // Force the use of the Istanbul instrumenter to cover CoffeeScript files
            },
            type : 'lcov',
            dir : 'coverage',
            subdir: '.'
        },
        loggers: [{ type: 'console'}],
        files: [
            //3rd Party Code
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/angular-resource/angular-resource.js',
            //'bower_components/stacktrace-js/dist/stacktrace.js',

            //mocha stuff
            'test/mocha.conf.js',

            'dist/ng1-server.js',
            {
                pattern:'dist/ng1.0.0-server.js.map',
                included: false
            },
            //test files
            {
                pattern: 'test/unit/json/*',
                served: true,
                wacthed: false,
                included: true
            }
        ],
        socketIOServer: {
            port: 8882,
            allowRequest: function(handshake, cb) {
                return cb(null, true); // authorize every connections
            },

            rules: function (socket, log) {
                socket.on('IDLE', function( data ) {
                    socket.emit('IDLE' + data.uid);
                });

                socket.on('LOG', function(data) {

                })
            }
        }
    }
};
