function calcCenter(resultsList) {
  var groupList = {};
  for (var i = 0; i < resultsList.length; i++) {
    var results = resultsList[i];
    for (var j = 0; j < results.length; j++) {
      var result = results[j];

      var _case = result.case;
      var key = [_case.server, _case.resource, _case.delay, _case.proxyDelay].join(':');
      groupList[key] = groupList[key] || [];
      groupList[key][i] = result;
    }
  }

  var ret = [];
  Object.keys(groupList).forEach(function(key) {
    var list = groupList[key];
    var values = [];
    for (var i = 0; i < list.length; i++) {
      var result = list[i];
      if (!result) {
        console.log(key);
        continue;
      }
      var value = result.resourceList.reduce(function(memo, resource) {
        return memo + resource.responseEnd;
      }, 0);
      values[i] = {
        value: value,
        result: result
      };
    }
    values.sort(function(a, b) {
      return a.value - b.value;
    });
    var mid = values[Math.floor(list.length / 2)];
    ret.push(mid.result);
  });
  return ret;
}

function calcLastResponseEnd(result) {
  var last = 0;
  for (var i = 0; i < result.resourceList.length; i++) {
    var resource = result.resourceList[i];
    if (resource.responseEnd > last) {
      last = resource.responseEnd;
    }
  }
  return last;
}

function filterResults(results, filter) {
  return results.filter(function(result) {
    var keys = Object.keys(filter);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (result.case[key] !== filter[key]) {
        return false;
      }
    }
    return true;
  });
}

module.exports = {
  calcCenter: calcCenter,
  calcLastResponseEnd: calcLastResponseEnd,
  filterResults: filterResults
};