var path = require('path');

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'dist/ng1-server.js'
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
};