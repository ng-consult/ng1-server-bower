var path = require('path');

module.exports = function () {
    return {
        basePath: './../',
        frameworks: ['mocha', 'chai', 'mocha-debug', 'sinon-chai'],
        reporters: ['mocha', 'coverage'],
        browsers: ['Chrome'],
        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        },
        preprocessors: {
            '**/*.json': ['json'],
            'dist/angular.js-server.js': ['coverage'],
            //'src/index.ts': ['webpack', 'sourcemap']
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
        webpack: {
            entry: 'src/index.ts',
            output: {
                filename: 'dist/angular.js-server.js'
            },
            devtool: 'source-map',
            resolve: {
                root: path.resolve('./src'),
                extensions: ['', '.ts']
            },
            plugins: [
                //new webpack.optimize.UglifyJsPlugin({ minimize: true })
            ],
            debug: true,
            module: {
                loaders: [
                    { test: /\.ts$/, loader: 'ts-loader' }
                ]
            }
        },
        webpackMiddleware: {
            // webpack-dev-middleware configuration
            // i.e.
            noInfo: true,
            // and use stats to turn off verbose output
            stats: {
                // options i.e.
                chunks: false
            }
        },
        files: [
            //3rd Party Code
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/angular-resource/angular-resource.js',
            //'bower_components/stacktrace-js/dist/stacktrace.js',

            //mocha stuff
            'test/mocha.conf.js',
            //'src/index.ts',
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
            },
            'test/unit/*.js'
        ]
    }
};
