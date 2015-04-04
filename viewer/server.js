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
      if (index === 'all') {
        var cases = fs.readFileSync(__dirname + '/../results/cases.json');
        cases = JSON.parse(cases);
        var resultsList = [];
        cases.indexVariation.forEach(function(index) {
          var path = __dirname + '/../results/' + index + '.json';
          var data = JSON.parse(fs.readFileSync(path));
          resultsList.push(data);
        });
        var resultsListStr = JSON.stringify(resultsList);
        // console.log(resultsListStr);
        res.writeHead(200, {
          'Content-Type': 'application/json'
        });
        res.end(resultsListStr);
        return;
      } else {
        var path = __dirname + '/../results/' + index + '.json';
        var stat = fs.statSync(path);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': stat.size
        });
        fs.createReadStream(path).pipe(res);
        return;
      }
    } else if (req.url === '/cases') {
      var path = __dirname + '/../results/cases.json';
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