function getResult() {
  var resourceList = window.performance.getEntriesByType("resource").map(function(r) {
    return {
      connectEnd: r.connectEnd,
      connectStart: r.connectStart,
      domainLookupEnd: r.domainLookupEnd,
      domainLookupStart: r.domainLookupStart,
      duration: r.duration,
      entryType: r.entryType,
      fetchStart: r.fetchStart,
      initiatorType: r.initiatorType,
      name: r.name,
      redirectEnd: r.redirectEnd,
      redirectStart: r.redirectStart,
      requestStart: r.requestStart,
      responseEnd: r.responseEnd,
      responseStart: r.responseStart,
      secureConnectionStart: r.secureConnectionStart,
      startTime: r.startTime
    };
  });
  return {
    port: location.port,
    performance: {
      navigation: {
        type: window.performance.navigation.type,
        redirectCount: window.performance.navigation.redirectCount
      },
      timing: {
        connectEnd: window.performance.timing.connectEnd,
        connectStart: window.performance.timing.connectStart,
        domComplete: window.performance.timing.domComplete,
        domContentLoadedEventEnd: window.performance.timing.domContentLoadedEventEnd,
        domContentLoadedEventStart: window.performance.timing.domContentLoadedEventStart,
        domInteractive: window.performance.timing.domInteractive,
        domLoading: window.performance.timing.domLoading,
        domainLookupEnd: window.performance.timing.domainLookupEnd,
        domainLookupStart: window.performance.timing.domainLookupStart,
        fetchStart: window.performance.timing.fetchStart,
        loadEventEnd: window.performance.timing.loadEventEnd,
        loadEventStart: window.performance.timing.loadEventStart,
        navigationStart: window.performance.timing.navigationStart,
        redirectEnd: window.performance.timing.redirectEnd,
        redirectStart: window.performance.timing.redirectStart,
        requestStart: window.performance.timing.requestStart,
        responseEnd: window.performance.timing.responseEnd,
        responseStart: window.performance.timing.responseStart,
        secureConnectionStart: window.performance.timing.secureConnectionStart,
        unloadEventEnd: window.performance.timing.unloadEventEnd,
        unloadEventStart: window.performance.timing.unloadEventStart
      }
    },
    resourceList: resourceList
  };
}

setTimeout(function() {
  var result = getResult();
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://' + location.host + ':9000/result', true);
  xhr.onload = function(e) {
    var nextUrl = this.response;
    if (nextUrl) {
      location.href = nextUrl;
    }
  };
  xhr.send(JSON.stringify(result));

}, 1000);
