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

var _cases = null;
var _resultList = [];

var ResultsStorage = assign({}, EventEmitter.prototype, {
  get: function(index) {
    if (typeof index !== 'string') {
      return Promise.resolve(null);
    }
    if (index === 'center') {
      if (_resultList[index]) {
        return Promise.resolve(_resultList[index]);
      }
      return getAll().then(function(resultsList) {
        _resultList[index] = calc.calcCenter(resultsList);
        return _resultList[index];
      });
    } else if (index === 'all') {
      return getAll();
    } else {
      return getOne(index);
    }
  },
  getCases: function() {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'text';
      xhr.open('GET', '/cases', true);
      xhr.onload = function(e) {
        if (this.status == 200) {
          var cases = this.response;
          cases = JSON.parse(cases);
          _cases = cases;
          resolve(cases);
        } else {
          _resultList[index] = 'error';
          reject();
        }
      };
      xhr.send();
    });
  }
});

function getOne(index) {
  if (_resultList[index]) {
    return Promise.resolve(_resultList[index]);
  }
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.open('GET', '/data/' + index, true);
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

function getAll() {
  if (_resultList['all']) {
    return Promise.resolve(_resultList['all']);
  }
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.open('GET', '/data/all', true);
    // xhr.responseType = 'application/json';
    xhr.onload = function(e) {
      if (this.status == 200) {
        var resultsList = this.response;
        resultsList = JSON.parse(resultsList);
        resultsList.forEach(function(results, index) {
          _resultList[index] = results;
        });
        _resultList['all'] = resultsList;
        resolve(resultsList);
      } else {
        // _resultList[index] = 'error';
        reject();
      }
    };
    xhr.send();
  });
}


module.exports = ResultsStorage;