var React = require('react/addons');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var calc = require('./calc.js');

var generateId = (function() {
  var id = 0;
  return function() {
    return '_' + id++;
  }
})();

var _resultList = [];

var ResultsStorage = assign({}, EventEmitter.prototype, {
  get: function(index) {
    if(typeof index !== 'string') {
      return Promise.resolve(null);
    }
    if (index === 'center') {
      if (_resultList[index]) {
        return Promise.resolve(_resultList[index]);
      }
      return Promise.all([0, 1, 2, 3, 4].map(getOne)).then(function(resultsList) {
        _resultList[index] = calc.calcCenter(resultsList);
        return _resultList[index];
      });
    } else {
      return getOne(index);
    }
  }
});

function getOne(index) {
  if (_resultList[index]) {
    return Promise.resolve(_resultList[index]);
  }
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/data/' + index, true);
    xhr.responseType = 'application/json';
    xhr.onload = function(e) {
      if (this.status == 200) {
        var results = this.response;
        results = JSON.parse(results);
        _resultList[index] = results;
        resolve(results);
      } else {
        _resultList[index] = 'error';
        reject();
      }
    };
    xhr.send();
  });
}


module.exports = ResultsStorage;