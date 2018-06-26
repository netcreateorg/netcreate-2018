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
const D3NetGraph = require('./d3-simplenetgraph')
const UNISYS     = require('system/unisys');
var   UDATA      = null;


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NetGraph extends React.Component {

    constructor (props) {
      super(props)
      this.state = {
        d3NetGraph: {}
      }
      UDATA = UNISYS.NewDataLink(this);
    }

    componentDidMount () {
      // D3NetGraph Constructor
      let el = ReactDOM.findDOMNode( this )
      let d3NetGraph = new D3NetGraph(el);
      this.setState({ d3NetGraph });
    }

    shouldComponentUpdate () {
      // This prevents React from updating the component,
      // allowing D3 to handle the simulation animation updates
      // This is also necessary for D3 to handle the
      // drag events.
      return false
    }

    render () {
      return (<div>SVG</div>)
    }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetGraph;
