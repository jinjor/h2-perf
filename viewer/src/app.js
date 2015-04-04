var React = require('react/addons');
var urlParse = require('url-parse');
var assign = require('object-assign');
var ResultsStorage = require('./storage.js');
var calc = require('./calc.js');
var Perf = React.addons.Perf;

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

var Timing = React.createClass({
  render: function() {
    var time = this.props.time;
    var style = {
      left: msToPx * time
    };
    var time = Math.round(time) + 'ms';
    var className = "resource__axis resource__axis_timing " + this.props.className;
    return <div data-time={time} className={className} style={style}></div>;
  }
});

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

    var timings = [];
    if(data) {
      var lastResponseEndTime = (data ? calc.calcLastResponseEnd(data) : 0);
      timings.push(<Timing key="resource__axis_last_resend" time={lastResponseEndTime} className="resource__axis_last_resend"/>);
      if(data.chromeLoadTimes) {
        var firstPaint = data.chromeLoadTimes.firstPaintTime * 1000 - data.performance.timing.navigationStart;
        timings.push(<Timing key="resource__axis_first_paint" time={firstPaint} className="resource__axis_first_paint"/>);
      }
    }
    var style = {
      height: 13 * length - 1
    };
    return (
    <div className="resource__header" style={style}>
      {axis}
      {timings}
    </div>
    );
  }
});

var MainResource = React.createClass({
  render: function() {
    var data = this.props.data;

    var timing = data.performance.timing;
    var chromeLoadTimes = data.chromeLoadTimes;
    var name = 'index.html';
    Object.keys(timing).forEach(function(key) {
      console.log(key + ':' + (timing[key] - timing.navigationStart));
    });
    if(chromeLoadTimes) {
      Object.keys(chromeLoadTimes).forEach(function(key) {
        if(+chromeLoadTimes[key]) {
          console.log(key + ':' + (+chromeLoadTimes[key] * 1000 - timing.navigationStart));
        } else {
          console.log(key + ':' + (chromeLoadTimes[key]));
        }
      });
    }
    console.log(chromeLoadTimes);
    var conReqStyle = {
      left: msToPx * timing.connectStart - timing.navigationStart,
      width: msToPx * (timing.requestStart - timing.connectStart)
    };
    var reqResStyle = {
      left: msToPx * timing.requestStart - timing.navigationStart,
      width: msToPx * (timing.responseStart - timing.requestStart)
    };
    var resResendStyle = {
      left: msToPx * timing.responseStart - timing.navigationStart,
      width: msToPx * (timing.responseEnd - timing.responseStart)
    };
    var domLoadDomInteractiveStyle = {
      left: msToPx * timing.domLoading - timing.navigationStart,
      width: msToPx * (timing.domInteractive - timing.domLoading)
    };
    var domInteractiveDomCompleteStyle = {
      left: msToPx * timing.domInteractive - timing.navigationStart,
      width: msToPx * (timing.domComplete - timing.domInteractive)
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
    var cases = this.props.cases;
    if(!cases) {
      return null;
    }
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
    var cases = this.props.cases;
    var result = null;
    if(results && query) {
      var targetCase = query;
      var result = findResult(results, targetCase);
    }

    var mainResource = result ? <li key="main-resource"><MainResource data={result}/></li> : null;
    var resourcesView = result ? result.resourceList.filter(function(resource) {
      return resource.name.indexOf('result') < 0;
    }).map(function(resource) {
      return <li key={resource.name}><Resource data={resource}/></li>
    }) : null;
    return (
      <div>
        <Condition cases={cases} query={query}/>
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
    var cases = this.props.cases;
    var results = this.props.results;
    if(!cases) {
      return null;
    }
    var comparisons = results ? cases.resourceVariation.map(function(resource) {
      var fileteredResults = calc.filterResults(results, {
        resource: resource,
        delay: this.props.delay
      });
      return <SereverComparison cases={cases} key={resource} resource={resource} results={fileteredResults}/>;
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
      results: null,
    };
  },
  componentDidMount: function() {
    var setQuery = function() {
      var parsed = urlParse(location.hash.substring(1), true);
      var page = parsed.host;
      var query = assign(this.state.query || {}, parsed.query);
      query.delay = +query.delay;
      query.proxyDelay = +query.proxyDelay;
      Promise.all([ResultsStorage.get('center'), ResultsStorage.get(query.index), ResultsStorage.getCases()])
        .then(function(resultList) {
          console.log(resultList[1]);

          this.setState({
            page: page,
            query: query,
            centerResults: resultList[0],
            results: resultList[1],
            cases: resultList[2]
          });
        }.bind(this));
    }.bind(this);
    window.onhashchange = setQuery;
    if((location.hash || '').indexOf('?') >= 0) {
      setQuery();
    } else {
      updateHash('waterfall', 'center', '1', 'many-image', 10, 0);
    }
  },
  render: function() {
    var cases = this.state.cases;
    var results = this.state.results;
    var query = this.state.query;
    var page = null;
    if(!cases) {
      return null;
    }
    if(this.state.page === 'waterfall'){
      page = <Waterfall query={query} cases={cases} results={results}/>;
    } else if(this.state.page === 'comparison'){
      page = <div>
        <Comparison delay={0} cases={cases} results={this.state.centerResults}/>
        <Comparison delay={10} cases={cases} results={this.state.centerResults}/>
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