var React = require('react/addons');
var urlParse = require('url-parse');
var assign = require('object-assign');
var ResultsStorage = require('./storage.js');
var calc = require('./calc.js');
var Perf = React.addons.Perf;
var cases = require('../../cases.js');

function findResult(results, targetCase) {
  var result = null;
  for(var i = 0; i < results.length; i++) {
    var _result = results[i];
    if(_result.case.resource === targetCase.resource &&
      _result.case.server === targetCase.server &&
      _result.case.delay === targetCase.delay &&
      (_result.case.server.indexOf('+') < 0 || _result.case.proxyDelay === targetCase.proxyDelay)) {
      result = _result;
      break;
    }
  }

  return result;
}

var msToPx = 1;

var ResourceHeader = React.createClass({
  render: function() {
    var data = this.props.data;
    var length = (data ? data.resourceList.length : 0) + 1;
    var axis = [50,100,150,200,250,300,350,400,450,500,550,600].map(function(ms) {
      var style = {
        left: msToPx * ms
      };
      return <div key={ms} className="resource__axis" style={style}></div>
    });
    var lastResponseEndTime = (data ? calc.calcLastResponseEnd(data) : 0);
    var lastResponseEndStyle = {
      left: msToPx * lastResponseEndTime
    };
    var time = Math.round(lastResponseEndTime) + 'ms';
    var lastResponseEnd = data ? <div data-time={time} className="resource__axis resource__axis_last_resend" style={lastResponseEndStyle}></div> : null;

    var style = {
      height: 13 * length - 1
    };
    return (
    <div className="resource__header" style={style}>
      {axis}
      {lastResponseEnd}
    </div>
    );
  }
});

var MainResource = React.createClass({
  render: function() {
    var data = this.props.data;
    var name = 'index.html';
    // Object.keys(data).forEach(function(key) {
    //   console.log(key + ':' + (data[key] - data.navigationStart));
    // });
    var conReqStyle = {
      left: msToPx * data.connectStart - data.navigationStart,
      width: msToPx * (data.requestStart - data.connectStart)
    };
    var reqResStyle = {
      left: msToPx * data.requestStart - data.navigationStart,
      width: msToPx * (data.responseStart - data.requestStart)
    };
    var resResendStyle = {
      left: msToPx * data.responseStart - data.navigationStart,
      width: msToPx * (data.responseEnd - data.responseStart)
    };
    var domLoadDomInteractiveStyle = {
      left: msToPx * data.domLoading - data.navigationStart,
      width: msToPx * (data.domInteractive - data.domLoading)
    };
    var domInteractiveDomCompleteStyle = {
      left: msToPx * data.domInteractive - data.navigationStart,
      width: msToPx * (data.domComplete - data.domInteractive)
    };
    // resource__header is an exception for simplifying layout
    return (
    <div className="resource">
      <div className="resource__name">{name}</div>
      <div className="resource__bar_container resource__main">
        <div className="resource__bar resource__bar_con_to_req" style={conReqStyle}></div>
        <div className="resource__bar resource__bar_req_to_res" style={reqResStyle}></div>
        <div className="resource__bar resource__bar_res_to_resend" style={resResendStyle}></div>
        <div className="resource__bar resource__bar_domload_to_dominteractive" style={domLoadDomInteractiveStyle}></div>
        <div className="resource__bar resource__bar_dominteractive_to_domcomplete" style={domInteractiveDomCompleteStyle}></div>
      </div>
    </div>
    );
  }
});

var Resource = React.createClass({
  render: function() {
    var data = this.props.data;
    var splitted = data.name.split('/');
    var name = splitted[splitted.length - 1];
    // console.log(name, data.requestStart + ' -> ' + data.responseEnd);
    var conReqStyle = {
      left: msToPx * data.connectStart,
      width: msToPx * (data.requestStart - data.connectStart)
    };
    var reqResStyle = {
      left: msToPx * data.requestStart,
      width: msToPx * (data.responseStart - data.requestStart)
    };
    var resResendStyle = {
      left: msToPx * data.responseStart,
      width: msToPx * (data.responseEnd - data.responseStart)
    };
    return (
    <div className="resource">
      <div className="resource__name">{name}</div>
      <div className="resource__bar_container">
        <div className="resource__bar resource__bar_con_to_req" style={conReqStyle}></div>
        <div className="resource__bar resource__bar_req_to_res" style={reqResStyle}></div>
        <div className="resource__bar resource__bar_res_to_resend" style={resResendStyle}></div>
      </div>
    </div>
    );
  }
});


function updateHash(page, index, server, resource, delay, proxyDelay) {
  // if(page === 'waterfall') {
    location.href = '#' + page + '?index=' + index + '&server=' + server + '&resource=' + resource + '&delay=' + delay + '&proxyDelay=' + proxyDelay;
  // } else {
  //   location.href = '#' + page;
  // }
}

var Condition = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  handleChange: function() {
    var form = React.findDOMNode(this.refs.form);
    var index = (form.querySelector('input[name="index"]:checked')|| {}).value || '';
    var server = (form.querySelector('input[name="server"]:checked')|| {}).value || '';
    var resource = (form.querySelector('input[name="resource"]:checked')|| {}).value || '';
    var delay = (form.querySelector('input[name="delay"]:checked')|| {}).value || 0;
    var proxyDelay = (form.querySelector('input[name="proxy-delay"]:checked') || {}).value || 0;
    updateHash('waterfall', index, server, resource, delay, proxyDelay);
  },
  render: function() {
    var query = this.props.query || {
      index: null,
      server: '',
      resource: '',
      delay: null,
      proxyDelay: null
    };
    var indexOptions = ['center'].concat(cases.indexVariation.map(function(index) {
      return '' + index;
    })).map(function(index) {
      var checked = index === query.index;
      var id = 'option-index-' + index;
      return (<div key={index} className="condition__var__option">
        <input id={id} type="radio" name="index" value={index} checked={checked} onChange={this.handleChange}/>
        <label htmlFor={id}>{index}</label>
      </div>);
    }.bind(this));
    var serverOptions = cases.serverVariation.map(function(server) {
      var checked = server === query.server;
      var id = 'option-server-' + server;
      return (<div key={server} className="condition__var__option">
        <input id={id} type="radio" name="server" value={server} checked={checked} onChange={this.handleChange}/>
        <label htmlFor={id}>{server}</label>
      </div>);
    }.bind(this));
    var resourceOptions = cases.resourceVariation.map(function(resource) {
      var checked = resource === query.resource;
      var id = 'option-resource-' + resource;
      return (<div key={resource} className="condition__var__option">
        <input id={id} type="radio" name="resource" value={resource} checked={checked} onChange={this.handleChange}/>
        <label htmlFor={id}>{resource}</label>
      </div>);
    }.bind(this));
    var delayOptions = cases.delayVariation.map(function(delay) {
      var checked = delay === query.delay;
      var id = 'option-delay-' + delay;
      return (<div key={delay} className="condition__var__option">
        <input id={id} type="radio" name="delay" value={delay} checked={checked} onChange={this.handleChange}/>
        <label htmlFor={id}>{delay}</label>
      </div>);
    }.bind(this));
    var proxyDisabled = query.server.indexOf('+') < 0;
    var proxyDelayOptions = proxyDisabled ? null : cases.proxyDelayVariation.map(function(proxyDelay) {
      var checked = proxyDelay === query.proxyDelay;
      var id = 'option-proxy-delay-' + proxyDelay;
      return (<div key={proxyDelay} className="condition__var__option">
        <input id={id} type="radio" name="proxy-delay" value={proxyDelay} checked={checked} onChange={this.handleChange}/>
        <label htmlFor={id}>{proxyDelay}</label>
      </div>);
    }.bind(this));

    return (
    <form ref="form" className="condition">
      <div className="condition__var condition__var_index">
        <label className="condition__var__label">Index</label>{indexOptions}
      </div>
      <div className="condition__var condition__var_server">
        <label className="condition__var__label">Server</label>{serverOptions}
      </div>
      <div className="condition__var condition__var_resource">
        <label className="condition__var__label">Resource</label>{resourceOptions}
      </div>
      <div className="condition__var condition__var_delay">
        <label className="condition__var__label">Delay</label>{delayOptions}
      </div>
      <div className="condition__var condition__var_proxy_delay">
        <label className="condition__var__label">Proxy delay</label>{proxyDelayOptions}
      </div>
    </form>
    );
  }
});

var Waterfall = React.createClass({
  render: function() {
    var results = this.props.results;
    var query = this.props.query;

    var result = null;
    if(results && query) {
      var targetCase = query;
      var result = findResult(results, targetCase);
    }
    var mainResource = result ? <li key="main-resource"><MainResource data={result.performance.timing}/></li> : null;
    var resourcesView = result ? result.resourceList.filter(function(resource) {
      return resource.name.indexOf('result') < 0;
    }).map(function(resource) {
      return <li key={resource.name}><Resource data={resource}/></li>
    }) : null;
    return (
      <div>
        <Condition query={query}/>
        <div className="resource_viewer">
          <ResourceHeader data={result}/>
          <ul>
            {mainResource}
            {resourcesView}
          </ul>
        </div>
      </div>
    );
  }
});


var SereverComparison = React.createClass({
  render: function() {
    var results = this.props.results;
    var resource = this.props.resource;
    var bars = ['1', '1s', '2', '2p'].map(function(server, i) {
      var fileteredResults = calc.filterResults(results, {
        server: server
      });
      var result = fileteredResults[0];
      var lastResend = calc.calcLastResponseEnd(result);
      var style = {
        width: msToPx * lastResend
      };
      var clazz = 'server_comparison__bar server_comparison__bar_' + i;
      var time = Math.round(lastResend) + 'ms';
      return <div className={clazz} key={server} style={style}><span>{time}</span></div>
    });
    return (
      <div className="server_comparison">
        <div className="server_comparison__head">{resource}</div>
        <div className="server_comparison__body">{bars}</div>
      </div>
    );
  }
});



var Comparison = React.createClass({
  render: function() {
    var results = this.props.results;
    var comparisons = results ? cases.resourceVariation.map(function(resource) {
      var fileteredResults = calc.filterResults(results, {
        resource: resource,
        delay: this.props.delay
      });
      return <SereverComparison key={resource} resource={resource} results={fileteredResults}/>;
    }.bind(this)) : null;
    return (
      <div className="comparison">
        <div className="comparison__head">@delay={this.props.delay}</div>
        {comparisons}
      </div>
    );
  }
});






var App = React.createClass({
  getInitialState: function() {
    return {
      page: null,
      query: null,
      results: null
    };
  },
  componentDidMount: function() {
    var setQuery = function() {
      var parsed = urlParse(location.hash.substring(1), true);
      var page = parsed.host;
      var query = assign(this.state.query || {}, parsed.query);
      query.delay = +query.delay;
      query.proxyDelay = +query.proxyDelay;
      Promise.all([ResultsStorage.get('center'), ResultsStorage.get(query.index)])
        .then(function(centerResults_results) {
          this.setState({
            page: page,
            query: query,
            centerResults: centerResults_results[0],
            results: centerResults_results[1]
          });
        }.bind(this));
    }.bind(this);
    window.onhashchange = setQuery;
    if((location.hash || '').indexOf('?') >= 0) {
      setQuery();
    } else {
      updateHash('waterfall', 'center', '1', 'many-image', cases.delayVariation[1], 0);
    }
  },
  render: function() {
    var results = this.state.results;
    var query = this.state.query;
    var page = null;
    if(this.state.page === 'waterfall'){
      page = <Waterfall query={query} results={results}/>;
    } else if(this.state.page === 'comparison'){
      page = <div>
        <Comparison delay={0} results={this.state.centerResults}/>
        <Comparison delay={10} results={this.state.centerResults}/>
      </div>;
    }
    return (
      <div>
        <h1>Result</h1>
        <ol className="menu">
          <li><a href="#waterfall">waterfall</a></li>
          <li><a href="#comparison">comparison</a></li>
        </ol>
        {page}
      </div>
    );
  }
});

React.render(
  <App></App>,
  document.getElementById('app-container')
);