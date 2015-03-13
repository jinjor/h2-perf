var http = require('http');
var https = require('https');
var ecstatic = require('ecstatic');
var Transform = require('stream').Transform;
var util = require('util');
var fs = require('fs');
var open = require('open');


function result(middleware) {
  return function(req, res) {
    var args = arguments;
    if (req.url.indexOf('/data') === 0) {
      var index = req.url.split('/data/')[1];
      var path = __dirname + '/../results/' + index + '.json';
      var stat = fs.statSync(path);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': stat.size
      });
      fs.createReadStream(path).pipe(res);
      return;
    }
    middleware.apply(this, args);
  };
}


var staticRouter = result(ecstatic(__dirname + '/public'));


// HTTP/1.1
http.createServer(staticRouter).listen(3000);