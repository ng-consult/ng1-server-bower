var sharedConfig = require('./karma-shared.conf');
var path = require('path');

module.exports = function (config) {
    var conf = sharedConfig();
    
    if (process.env.TRAVIS) {
        conf.browsers = ['Chrome_travis_ci'];
        conf.files.push('test/travis.conf.js');
        conf.files.push('test/local.conf.js');
        conf.files.push('test/unit/*.js');

    } else {
        conf.files.push('bower_components/source-map-support/browser-source-map-support.js');
        conf.files.push('src/index.ts');
        conf.files.push('test/local.conf.js');
        conf.files.push('test/unit/*.js');
        conf.preprocessors['src/index.ts'] =  ['webpack', 'sourcemap'];

        var localConf = {
            webpack: {
                entry: 'src/index.ts',
                output: {
                    filename: 'dist/angular.js-server.js'
                },
                devtool: 'inline-source-map',
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
                        {test: /\.ts$/, loader: 'ts-loader'}
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
            }
        };

        conf = Object.assign(conf, localConf);

        console.log(conf);

    }


    config.set(conf);
};
