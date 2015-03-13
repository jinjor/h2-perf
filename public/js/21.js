function getResult() {
  var resourceList = window.performance.getEntriesByType("resource")
  return {
    port: location.port,
    resource: location.href.split('/')[3].split('.')[0],
    performance: window.performance,
    resourceList: resourceList
  };
}
