var server = require('./server.js');
var open = require('open');

server('localhost', function(firstUrl) {
  open(firstUrl, "firefox");
});
