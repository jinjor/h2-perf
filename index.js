var server = require('./server.js');
var open = require('open');

server(function(firstUrl) {
  open(firstUrl, "firefox");
});
