/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

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

const DBG = true;
const PR = 'NCGraph';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React      = require('react')
const ReactDOM   = require('react-dom')
const ReactStrap = require('reactstrap');
const { Button } = ReactStrap;
const NCGraphRenderer = require('./NCGraphRenderer')
const UNISYS     = require('unisys/client');

let UDATA = null;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCGraph extends UNISYS.Component {
    constructor (props) {
      super(props)
      this.state = {
        d3NetGraph: {},
        nodeTypes: [],
        edgeTypes: []
      }

      this.updateNCData = this.updateNCData.bind(this);
      this.updateTemplate = this.updateTemplate.bind(this);
      this.updateColorMap = this.updateColorMap.bind(this);
      this.processNCData = this.processNCData.bind(this);
      this.getHelp = this.getHelp.bind(this);
      this.getUpdatedDateText = this.getUpdatedDateText.bind(this);
      this.onZoomReset = this.onZoomReset.bind(this);
      this.onZoomIn    = this.onZoomIn.bind(this);
      this.onZoomOut   = this.onZoomOut.bind(this);
      this.constructGraph = this.constructGraph.bind(this);

      /// Initialize UNISYS DATA LINK for REACT
      UDATA = UNISYS.NewDataLink(this);

      UDATA.OnAppStateChange('SYNTHESIZEDD3DATA', this.updateNCData);
      UDATA.OnAppStateChange('TEMPLATE', this.updateTemplate);
      UDATA.OnAppStateChange('COLORMAP', this.updateColorMap);
      UDATA.HandleMessage('CONSTRUCT_GRAPH', this.constructGraph);

    } // constructor


  /// CLASS PRIVATE METHODS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA METHODS
  /**
   *
   * @param {object} data
   * @param {array} data.nodes
   * @param {array} data.edges
   */
  updateNCData(data) {
    if (DBG) console.log(PR, 'got state D3DATA', data);
    const d3data = this.processNCData(data);
    this.state.d3NetGraph.SetData(data);
  }
  /**
   * Update default values when template has changed
   * @param {object} data TEMPLATE
   */
  updateTemplate(data) {
    if (DBG) console.log(PR, 'got state TEMPLATE', data);
    const TEMPLATE = this.AppState('TEMPLATE');
    // Update D3
    this.state.d3NetGraph.UpdateDefaultValues(TEMPLATE);
    // Update Legends
    const nodeTypes = TEMPLATE.nodeDefs.type.options;
    const edgeTypes = TEMPLATE.edgeDefs.type.options;
    // Update
    this.setState({ nodeTypes, edgeTypes }, () => {
      this.forceUpdate(); // just once, needed to overcome shouldComponentUpdate override
    });
  }
  /**
   * Node/Edge Colors in Template have been changed.
   * The template may be loaded or changed after NCDATA is loaded.
   * So we need to explicitly update the colors if the color
   * definitions have changed.
   */
  updateColorMap(data) {
    if (DBG) console.log(PR, 'got state COLORMAP', data);
    this.state.d3NetGraph.UpdateGraph();
  }
  /**
   * Interprets SYNTEHSIZEDD3DATA into a simplified form for the renderer
   * @param {*} data NCDATA { nodes, edges }
   * @returns {Object} {
   *                     nodes: [ ...{id, label, size, color, opacity, strokeColor, strokeWidth, help}],
   *                     edges: [ ...{id, sourceId, targetId, size, color, opacity}]
   *                   }
   */
  processNCData(data) {
    const d3data = {};
    const TEMPLATE = this.AppState('TEMPLATE');
    const COLORMAP = UDATA.AppState('COLORMAP');
    const nodes = data.nodes.map(n => {
        // Look up colors
        // REVIEW: Using label match.  Should we use id instead?
        // The advantage of using the label is backward compatibility with
        // Google Fusion table data as well as exportability.
        // If we save the type as an id, the data format will be
        // less human-readable.
        // The problem with this approach though is that any changes
        // to the label text will result in a failed color lookup!
      n.color = COLORMAP.nodeColorMap[n.type];
      n.opacity = n.filteredTransparency;
      n.size = Math.min(TEMPLATE.nodeSizeDefault + n.degrees, TEMPLATE.nodeSizeMax);
      n.strokeColor = n.selected || n.strokeColor || undefined;
      n.strokeWidth = n.selected || n.strokeColor ? '5px' : undefined;
      n.help = this.getHelp(n);
      return n;
    })
    d3data.nodes = nodes;
    d3data.edges = data.edges;
    return d3data;
  }
  /**
   * Returns the tooltip help text for the node, using labels defined in the template
   * @param {*} node
   * @returns {string}
   */
  getHelp(node) {
    const TEMPLATE = this.AppState('TEMPLATE');
    const nodeDefs = TEMPLATE.nodeDefs;
    let titleText = "";
    if (nodeDefs.label.includeInGraphTooltip !== undefined) {
      // Add Label
      if (nodeDefs.label.includeInGraphTooltip) titleText += nodeDefs.label.displayLabel + ": " + node.label + "\n";
      // Add type
      if (nodeDefs.type.includeInGraphTooltip) titleText += nodeDefs.type.displayLabel + ": " + node.type + "\n";
      // Add degrees
      if (nodeDefs.degrees.includeInGraphTooltip) titleText += nodeDefs.degrees.displayLabel + ": " + node.degrees + "\n";
      // Add notes
      if (nodeDefs.notes.includeInGraphTooltip) titleText += nodeDefs.notes.displayLabel + ": " + node.notes + "\n";
      // Add info
      if (nodeDefs.info.includeInGraphTooltip) titleText += nodeDefs.info.displayLabel + ": " + node.info + "\n";
      // Add updated info
      if (nodeDefs.updated.includeInGraphTooltip) titleText += nodeDefs.updated.displayLabel + ": " + this.getUpdatedDateText(node);
    } else {
      // For backwards compatability
      titleText += nodeDefs.displayLabel.label + ": " + node.label + "\n";
    }
    return titleText;
  }
  getUpdatedDateText(nodeEdge) {
    const d = new Date(nodeEdge.meta.revision > 0 ? nodeEdge.meta.updated : nodeEdge.meta.created);
    const year = String(d.getFullYear());
    const date = (d.getMonth() + 1) + "/" + d.getDate() + "/" + year.substr(2, 4);
    const time = d.toTimeString().substr(0, 5);
    const author = nodeEdge._nlog ? nodeEdge._nlog[nodeEdge._nlog.length - 1] : 'unknown';
    const dateTime = date + ' at ' + time + " by " + author;
    return dateTime;
  }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI METHODS

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



    /// REACT LIFECYCLE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ constructGraph() {
      // first destroy any existing SVG graph elements
      const netgraph = document.getElementById('netgraph');
      if (netgraph) netgraph.remove();

      // D3NetGraph Constructor
      const el = ReactDOM.findDOMNode(this);
      const TEMPLATE = this.AppState('TEMPLATE');
      if (this.state.d3NetGraph && this.state.d3NetGraph.Deregister) {
        // if d3NetGraph was previously created, deregister it so it stops receiving data updates
        this.state.d3NetGraph.Deregister();
      }
      const d3NetGraph = new NCGraphRenderer(el); //
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
      UDATA.AppStateChangeOff('SYNTHESIZEDD3DATA', this.updateNCData);
      UDATA.AppStateChangeOff('TEMPLATE', this.updateTemplate);
      UDATA.AppStateChangeOff('COLORMAP', this.updateColorMap);
      UDATA.UnhandleMessage('CONSTRUCT_GRAPH', this.constructGraph);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ shouldComponentUpdate () {
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
                <span style={{ fontSize: '12px' }} className="tooltiptext">{this.AppState('TEMPLATE').description}</span>
            </div>
          </div>
          <div style={{ position: 'absolute', right: '10px', width: '50px', zIndex:1001 }}>
            <Button outline onClick={this.onZoomIn} style={{ width:'35px', backgroundColor: '#fff', opacity: '0.8' }}>+</Button>&nbsp;
            <Button outline onClick={this.onZoomReset} style={{ width: '35px', backgroundColor: '#fff', opacity: '0.8'  }}>&bull;</Button>&nbsp;
            <Button outline onClick={this.onZoomOut} style={{ width: '35px', backgroundColor: '#fff', opacity: '0.8'  }}>-</Button>
          </div>
          <div style={{ position: 'absolute', bottom: '40px', marginLeft: '10px', marginBottom: '15px',fontSize: '10px' }}>

            <div style={{ display: 'inline-block', paddingRight: '2em' }}>KEY</div>
            <br></br>
            <div style={{ display: 'inline-block', paddingRight: '2em' }}> - Node Types:</div>
            {nodeTypes.map((type, i) => (
               <div key={i} className="tooltipAnchor">
                <div style={{ display: 'inline-block', paddingRight: '2em', lineHeight: '10px' }}>
                  <div style={{ display: 'inline-block', width: '10px', height: '8px', backgroundColor: type.color }}></div>
                    &nbsp;{ (type.label==='') ? 'No Type Selected' : type.label }
                  </div>
                   <span className="tooltiptextabove">{ (type.label==='') ? 'No Type Selected' : type.help || type.label }</span>
                </div>

            ))}
           <br></br>
          <div style={{ display: 'inline-block', paddingRight: '2em' }}> - Edge Types:</div>
            {edgeTypes.map((type, i) => (
               <div key={i} className="tooltipAnchor">
                <div style={{ display: 'inline-block', paddingRight: '2em', lineHeight: '10px' }}>
                  <div style={{ display: 'inline-block', width: '10px', height: '8px', backgroundColor: type.color }}></div>
                    &nbsp;{ (type.label==='') ? 'No Type Selected' : type.label }
                  </div>
                   <span className="tooltiptextabove">{ (type.label==='') ? 'No Type Selected' : type.help || type.label }</span>
                </div>

            ))}

          </div>
        </div>
      )
    }
} // class NetGraph


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCGraph;
