
module.exports = function () {
    return {
        basePath: './../',
        frameworks: ['mocha', 'chai', 'mocha-debug', 'sinon-chai'],
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
            'dist/angular.js-server.js': ['coverage']
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

            'dist/angular.js-server.js',
            {
                pattern:'dist/angular.js-server.js.map',
                included: false
            },
            //test files
            {
                pattern: 'test/unit/json/*',
                served: true,
                wacthed: false,
                included: true
            }
        ]
    }
};
