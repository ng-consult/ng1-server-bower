var sharedConfig = require('./karma-shared.conf');

module.exports = function(config) {
  var conf = sharedConfig();

  if (process.env.TRAVIS) {
    conf.browsers = ['Chrome_travis_ci'];
  }

  config.set(conf);
};
