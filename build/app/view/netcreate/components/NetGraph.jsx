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

var DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React      = require('react')
const ReactDOM   = require('react-dom')
const ReactStrap = require('reactstrap');
const { Button } = ReactStrap;
const D3NetGraph = require('./d3-simplenetgraph')
const UNISYS     = require('unisys/client');



/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NetGraph extends UNISYS.Component {
    constructor (props) {
      super(props)
      this.state = {
        d3NetGraph: {}
      }

      this.onZoomReset = this.onZoomReset.bind(this);
      this.onZoomIn    = this.onZoomIn.bind(this);
      this.onZoomOut   = this.onZoomOut.bind(this);

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

/// REACT LIFECYCLE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentDidMount () {
      // D3NetGraph Constructor
      let el = ReactDOM.findDOMNode(this);
      let d3NetGraph = new D3NetGraph(el);
      this.setState({ d3NetGraph });
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
      let nodeTypes = this.AppState('TEMPLATE').nodePrompts.type.options;
      return (
        <div style={{ height: '100%' }}>
          <div><span style={{ fontSize: '9px' }}>NETGRAPH</span></div>
          <div style={{ position: 'absolute', right: '10px', width: '50px', zIndex:1001 }}>
            <Button outline onClick={this.onZoomIn} style={{width:'35px'}}>+</Button>&nbsp;
            <Button outline onClick={this.onZoomReset} style={{ width: '35px' }}>&bull;</Button>&nbsp;
            <Button outline onClick={this.onZoomOut} style={{ width: '35px' }}>-</Button>
          </div>
          <div style={{ position: 'absolute', bottom: '40px', marginLeft: '10px', fontSize: '10px' }}>
            <span style={{ marginRight: '2em' }}></span>KEY:
            {nodeTypes.map((type, i) => (
              <div key={i} style={{ display:'inline-block', paddingRight:'2em', lineHeight:'10px' }}>
                <div style={{ display:'inline-block',width:'10px',height:'8px',backgroundColor:type.color }}></div>
                &nbsp;{ (type.label==='') ? 'No Type Selected' : type.label }
              </div>
            ))}
          </div>
        </div>
      )
    }
} // class NetGraph


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetGraph;
