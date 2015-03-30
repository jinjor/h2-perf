var assert = require('assert');
var times = 5;

var indexVariation = [];
for (var i = 0; i < times; i++) {
  indexVariation.push(i);
}
var resourceVariation = ['js', 'image', 'many-js', 'many-image', 'many-js-concat', 'many-image-sprite', 'css-image'];
var serverVariation = ['1', '1s', '2', '2p', '2p*', '2+1', '2p+1', 'h2o-plain', 'h2o-secure'];
var delayVariation = [0, 10];
var proxyDelayVariation = [0, 10];

var allVariation = (function() {
  var variation = [];
  indexVariation.forEach(function(i) {
    resourceVariation.forEach(function(resource) {
      serverVariation.forEach(function(server) {

        var _delayVariation = server.indexOf('h2o') >= 0 ? [0] : delayVariation;

        _delayVariation.forEach(function(delay) {
          if (server.indexOf('+') >= 0) {
            proxyDelayVariation.forEach(function(proxyDelay) {
              variation.push({
                resource: resource,
                server: server,
                delay: delay,
                proxyDelay: proxyDelay,
                index: i
              });
            });
          } else {
            variation.push({
              resource: resource,
              server: server,
              delay: delay,
              index: i
            });
          }
        });
      });
    });
  });
  return variation;
})();


module.exports = {
  indexVariation: indexVariation,
  resourceVariation: resourceVariation,
  serverVariation: serverVariation,
  delayVariation: delayVariation,
  proxyDelayVariation: proxyDelayVariation,
  allVariation: allVariation
};
