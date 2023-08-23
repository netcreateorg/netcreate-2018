/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    DEPRECATED -- NCGraph replaces NetGraph





    NetGraph is a React wrapper for a D3 net graph component.

    This component uses React to create the base dom element, but D3NetGraph
    handles the data updates, rendering and animation updates.

    React is explicitly prevented from updating the component (see
    shouldComponentUpdate)

    ## TO USE

            <NetGraph/>

    ## Why not use FauxDom?

    https://lab.oli.me.uk/react-faux-dom-state/
    This article suggests that maybe using force graphs with react-faux-dom
    not quite work.
        "If you want to animate things, use a React animation library (they’re
         great and work fine with faux DOM), you have to find the React way to
         do things, sadly some D3 concepts just don’t translate. If you want
         some physics based graph full of state then you’re probably better
         off keeping to the original way of embedding D3 in React, dropping
         out of React and letting D3 mutate that element."
    Indeed, in our testing, the animation updates were not optimal.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactDOM = require('react-dom');
const ReactStrap = require('reactstrap');
const { Button } = ReactStrap;
const D3NetGraph = require('./d3-simplenetgraph');
const UNISYS = require('unisys/client');

let UDATA = null;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NetGraph extends UNISYS.Component {
  constructor(props) {
    super(props);
    this.state = {
      d3NetGraph: {},
      nodeTypes: [],
      edgeTypes: []
    };

    this.onZoomReset = this.onZoomReset.bind(this);
    this.onZoomIn = this.onZoomIn.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);
    this.updateLegend = this.updateLegend.bind(this);
    this.constructGraph = this.constructGraph.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    this.OnAppStateChange('TEMPLATE', this.updateLegend);
    UDATA.HandleMessage('CONSTRUCT_GRAPH', this.constructGraph);
  } // constructor

  /// CLASS PRIVATE METHODS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
/*/ onZoomReset() {
    this.AppCall('ZOOM_RESET', {});
  }
  /*/
/*/ onZoomIn() {
    this.AppCall('ZOOM_IN', {});
  }
  /*/
/*/ onZoomOut() {
    this.AppCall('ZOOM_OUT', {});
  }

  updateLegend() {
    // Update Legends
    const TEMPLATE = this.AppState('TEMPLATE');
    const nodeTypes = TEMPLATE.nodeDefs.type.options;
    const edgeTypes = TEMPLATE.edgeDefs.type.options;
    this.setState({ nodeTypes, edgeTypes }, () => {
      this.forceUpdate(); // just once, needed to overcome shouldComponentUpdate override
    });
  }

  /// REACT LIFECYCLE ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
/*/ constructGraph() {
    // first destroy any existing SVG graph elements
    const netgraph = document.getElementById('netgraph');
    if (netgraph) netgraph.remove();
    // D3NetGraph Constructor

    // eslint-disable-next-line react/no-find-dom-node
    const el = ReactDOM.findDOMNode(this);
    const TEMPLATE = this.AppState('TEMPLATE');
    if (this.state.d3NetGraph && this.state.d3NetGraph.Deregister) {
      // if d3NetGraph was previously created, deregister it so it stops receiving data updates
      this.state.d3NetGraph.Deregister();
    }
    const d3NetGraph = new D3NetGraph(el, TEMPLATE.nodeDefs);
    const nodeTypes = TEMPLATE.nodeDefs.type.options;
    const edgeTypes = TEMPLATE.edgeDefs.type.options;
    this.setState({ d3NetGraph, nodeTypes, edgeTypes });
    this.forceUpdate(); // just once, needed to overcome shouldComponentUpdate override
  }

  /// REACT LIFECYCLE ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
/*/ componentDidMount() {
    this.constructGraph();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
/*/ componentWillUnMount() {
    this.AppStateChangeOff('TEMPLATE', this.updateLegend);
    UDATA.UnhandleMessage('CONSTRUCT_GRAPH', this.constructGraph);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
/*/ shouldComponentUpdate() {
    // This prevents React from updating the component,
    // allowing D3 to handle the simulation animation updates
    // This is also necessary for D3 to handle the
    // drag events.
    return false;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
/*/ render() {
    const { nodeTypes, edgeTypes } = this.state;
    return (
      <div style={{ height: '100%' }}>
        <div style={{ margin: '10px 0 0 10px' }}>
          <div className="tooltipAnchor">
            <span style={{ fontSize: '9px' }}>
              <div className="badge">?</div>
              NETGRAPH for {this.AppState('TEMPLATE').name}
            </span>
            <span style={{ fontSize: '12px' }} className="tooltiptext">
              {this.AppState('TEMPLATE').description}
            </span>
          </div>
        </div>
        <div
          style={{ position: 'absolute', right: '10px', width: '50px', zIndex: 1001 }}
        >
          <Button
            outline
            onClick={this.onZoomIn}
            style={{ width: '35px', backgroundColor: '#fff', opacity: '0.8' }}
          >
            +
          </Button>
          &nbsp;
          <Button
            outline
            onClick={this.onZoomReset}
            style={{ width: '35px', backgroundColor: '#fff', opacity: '0.8' }}
          >
            &bull;
          </Button>
          &nbsp;
          <Button
            outline
            onClick={this.onZoomOut}
            style={{ width: '35px', backgroundColor: '#fff', opacity: '0.8' }}
          >
            -
          </Button>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            marginLeft: '10px',
            marginBottom: '15px',
            fontSize: '10px'
          }}
        >
          <div style={{ display: 'inline-block', paddingRight: '2em' }}>KEY</div>
          <br></br>
          <div style={{ display: 'inline-block', paddingRight: '2em' }}>
            {' '}
            - Node Types:
          </div>
          {nodeTypes.map((type, i) => (
            <div key={i} className="tooltipAnchor">
              <div
                style={{
                  display: 'inline-block',
                  paddingRight: '2em',
                  lineHeight: '10px'
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '8px',
                    backgroundColor: type.color
                  }}
                ></div>
                &nbsp;{type.label === '' ? 'No Type Selected' : type.label}
              </div>
              <span className="tooltiptextabove">
                {type.label === '' ? 'No Type Selected' : type.help || type.label}
              </span>
            </div>
          ))}
          <br></br>
          <div style={{ display: 'inline-block', paddingRight: '2em' }}>
            {' '}
            - Edge Types:
          </div>
          {edgeTypes.map((type, i) => (
            <div key={i} className="tooltipAnchor">
              <div
                style={{
                  display: 'inline-block',
                  paddingRight: '2em',
                  lineHeight: '10px'
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '8px',
                    backgroundColor: type.color
                  }}
                ></div>
                &nbsp;{type.label === '' ? 'No Type Selected' : type.label}
              </div>
              <span className="tooltiptextabove">
                {type.label === '' ? 'No Type Selected' : type.help || type.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
} // class NetGraph

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetGraph;
