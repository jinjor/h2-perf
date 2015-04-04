var http = require('http');
var https = require('https');
var http2 = require('http2');
var autoPush = require('auto-push');
var request = require('request');
var ecstatic = require('ecstatic');
var Transform = require('stream').Transform;
var util = require('util');
var fs = require('fs');
var assign = require('object-assign');

var cases = require('./cases.js')({
  times: 1,
  h2o: false
});

var allVariation = cases.allVariation;

var H2 = 1;
var DELAY = 2;
var PROXY_DELAY = 4;
var PUSH = 8;
var H1PROXY = 16;
var H2PROXY = 32;
var H1S = 64;
var PUSH_OPT = 128;

var results = [];
var casesIndex = 0;


console.log('Executing ' + allVariation.length + ' cases...');



function createURL(nextCase, host) {
  host = host || 'localhost';
  console.log(nextCase);
  var port = 8000;
  var schema = (nextCase.server[0] === '2' || nextCase.server === '1s' || nextCase.server === 'h2o-secure') ? 'https' : 'http';
  if (nextCase.server === 'h2o-plain') port = 7000;
  else if (nextCase.server === 'h2o-secure') port = 7001;
  else {
    if (nextCase.server === '1s') port += H1S;
    else if (nextCase.server === '2') port += H2;
    else if (nextCase.server === '2p') port += H2 + PUSH;
    else if (nextCase.server === '2p*') port += H2 + PUSH + PUSH_OPT;
    else if (nextCase.server === '2+1') port += H1PROXY;
    else if (nextCase.server === '2p+1') port += H1PROXY + PUSH;

    if (nextCase.delay) port += DELAY;
    if (nextCase.proxyDelay) port += PROXY_DELAY;
  }
  var resource = nextCase.resource;
  return schema + '://' + host + ':' + port + '/' + resource + '.html';
}

function onEnd() {
  fs.writeFile('results/cases.json', JSON.stringify(cases), function(err) {
    process.exit(0);
  });
}


function onResult(res, result, host) {
  var currentCase = allVariation[casesIndex];
  result.case = currentCase;
  results.push(result);
  var nextUrl = null;
  casesIndex++;
  var nextCase = allVariation[casesIndex];
  if (!nextCase || currentCase.index !== nextCase.index) {
    fs.writeFile('results/' + currentCase.index + '.json', JSON.stringify(results), function(err) {
      console.log(err);
      if (!nextCase) {
        onEnd();
      }
    });
    results = [];
  }
  if (nextCase) {
    nextUrl = createURL(nextCase, host);
  }
  res.end(nextUrl);
}

function result(middleware, host) {
  return function(req, res) {
    var args = arguments;
    if (req.url === '/result') {
      var buffer = new Buffer(0);
      req.on('data', function(chunk) {
        buffer = Buffer.concat([buffer, chunk]);
      });
      req.on('end', function(chunk) {
        var result = JSON.parse(buffer.toString());
        onResult(res, result, host);
      });
      return;
    }
    middleware && middleware.apply(this, args);
  };
}


process.on('uncaughtException', function(err) {
  console.log('???', err);
});

function run(host) {

  function forceRefresh(middleware, delay) {
    return function(req, res, next) {
      var args = arguments;
      req = assign(req, {
        headers: assign(req.headers, {
          'if-modified-since': null,
          'if-none-match': null
        })
      });
      middleware.apply(this, [req, res, next]);
    };
  }

  function delayed(middleware, delay) {
    return function() {
      var args = arguments;
      setTimeout(function() {
        middleware.apply(this, args);
      }.bind(this), delay * 2);
    };
  }

  function h1ploxy(proxyDelay, port) {
    /*
     *        | ---(delay)--> |       | ---(proxyDelay)--> |
     * client |               | proxy |                    |server
     *        | <--(delay)--- |       | <--(proxyDelay)--- |
     */
    return result(delayed(function(req, res) {
      //
      request({
        method: req.method,
        url: 'http://localhost:' + port + req.url,
        headers: req.headers
      }).on('response', function(response) {
        var headers = {};
        Object.keys(response.headers).forEach(function(key) {
          if (key.toLowerCase() === 'connection') { //invalid in HTTP/2
            return;
          }
          if (key.toLowerCase() === 'transfer-encoding') { //invalid in HTTP/2
            return;
          }
          headers[key] = response.headers[key];
        });
        res.writeHead(response.statusCode, headers);
      }).pipe(res);
    }, proxyDelay), host);
  }

  var options = {
    key: fs.readFileSync(__dirname + '/ssl/key.pem'),
    cert: fs.readFileSync(__dirname + '/ssl/cert.pem')
  };

  var delay = cases.delayVariation[1];
  var proxyDelay = cases.proxyDelayVariation[1];

  var staticRouter = result(forceRefresh(ecstatic({
    cache: 0,
    root: __dirname + '/public'
  })), host);
  var delayedStaticRouter = delayed(staticRouter, delay);
  var autopushRouter = autoPush(staticRouter);
  var delayedAutopushRouter = delayed(autopushRouter, delay);

  var autopushOptions = {
    relations: {
      '/image.html': ['/app.js', '/images/image1a.png'],
      '/js.html': ['/app.js'],
      '/many-image.html': (function() {
        var list = ['app.js'];
        for (var i = 1; i <= 6; i++) {
          for (var j = 0; j < 10; j++) {
            var alpha = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'][j];
            var name = '/images/image' + i + alpha + '.png';
            list.push(name);
          }
        }
        return list;
      })(),
      '/many-js.html': (function() {
        var list = ['app.js'];
        for (var i = 1; i <= 60; i++) {
          var name = '/js/' + i + '.js';
          list.push(name);
        }
        return list;
      })(),
      '/many-image-sprite.html': ['/app.js', '/images/all.png'],
      '/many-js-concat.html': ['/app.js', '/js/all.js'],
      '/css-image.html': ['/app.js', '/style.css', '/images/image1a.png'],
    }
  }

  var autopushOptRouter = autoPush(staticRouter, autopushOptions);
  var delayedAutopushOptRouter = delayed(autopushOptRouter, delay);


  // HTTP/1.1
  http.createServer(staticRouter).listen(8000);
  http.createServer(delayedStaticRouter).listen(8000 + DELAY);
  // HTTPS
  https.createServer(options, staticRouter).listen(8000 + H1S);
  https.createServer(options, delayedStaticRouter).listen(8000 + H1S + DELAY);
  // HTTP/2
  http2.createServer(options, staticRouter).listen(8000 + H2);
  http2.createServer(options, delayedStaticRouter).listen(8000 + H2 + DELAY);
  // HTTP/2+PUSH_PROMISE
  http2.createServer(options, autopushRouter).listen(8000 + H2 + PUSH);
  http2.createServer(options, delayedAutopushRouter).listen(8000 + H2 + DELAY + PUSH);
  // HTTP/2+PUSH_PROMISE+OPTIMISE
  http2.createServer(options, autopushOptRouter).listen(8000 + H2 + PUSH + PUSH_OPT);
  http2.createServer(options, delayedAutopushOptRouter).listen(8000 + H2 + DELAY + PUSH + PUSH_OPT);
  // HTTP/2+HTTP/1.1
  http2.createServer(options, h1ploxy(0, 8000)).listen(8000 + H1PROXY);
  http2.createServer(options, h1ploxy(proxyDelay, 8000)).listen(8000 + H1PROXY + PROXY_DELAY);
  http2.createServer(options, delayed(h1ploxy(0, 8000), delay)).listen(8000 + H1PROXY + DELAY);
  http2.createServer(options, delayed(h1ploxy(proxyDelay, 8000), delay)).listen(8000 + H1PROXY + DELAY + PROXY_DELAY);
  // HTTP/2+HTTP/1.1+PUSH_PROMISE
  http2.createServer(options, autoPush(h1ploxy(0, 8000))).listen(8000 + H1PROXY + PUSH);
  http2.createServer(options, autoPush(h1ploxy(proxyDelay, 8000))).listen(8000 + H1PROXY + PUSH + PROXY_DELAY);
  http2.createServer(options, delayed(autoPush(h1ploxy(0, 8000)), delay)).listen(8000 + H1PROXY + PUSH + DELAY);
  http2.createServer(options, delayed(autoPush(h1ploxy(proxyDelay, 8000)), delay)).listen(8000 + H1PROXY + PUSH + DELAY + PROXY_DELAY);


  https.createServer(options, function(req, res) {
    var args = arguments;
    if (req.url === '/result') {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "X-PINGOTHER");
      res.setHeader("Access-Control-Max-Age", "1728000");
      var buffer = new Buffer(0);
      req.on('data', function(chunk) {
        buffer = Buffer.concat([buffer, chunk]);
      });
      req.on('end', function(chunk) {
        var result = JSON.parse(buffer.toString());
        // console.log(result);
        onResult(res, result, host);
      });
      return;
    }

  }).listen(9000);
}

module.exports = function(host, cb) {
  run(host);
  setTimeout(function() {
    var firstUrl = createURL(allVariation[0], host);
    console.log('first URL is ' + firstUrl);
    cb && cb(firstUrl);
  }, 1000);
};