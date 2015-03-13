function getResult() {
  var resourceList = window.performance.getEntriesByType("resource")
  return {
    port: location.port,
    performance: window.performance,
    resourceList: resourceList
  };
}

setTimeout(function() {
  var result = getResult();
  // console.log(result);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/result', true);
  xhr.onload = function(e) {
    var nextUrl = this.response
    if (nextUrl) {
      location.href = nextUrl;
    }
  };
  xhr.send(JSON.stringify(result));
}, 1000);
