/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    NetGraph

    NetGraph is basicallya React wrapper for a D3 net graph component.

    This component uses React to create the base dom element, but D3NetGraph
    handles the data updates, rendering and animation updates.

    React is explicitly prevented from updating the component (see
    shouldComponentUpdate)


    TO USE

            <NetGraph/>


    Why not use FauxDom?

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



/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React      = require('react')
const ReactDOM   = require('react-dom')
//const D3NetGraph = require('./D3NetGraph')
const D3NetGraph = require('./D3SimpleNetGraph')
/*STYLE*/// We use CamelCase only for React components, lowercase-only for all other modules
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

    /*NEWCODE*/
    UDATA = UNISYS.NewDataLink(this);
    /*STYLE*/// explicitly listing the prop-based handlers here is a good convention to maintain
            /// e.g. onNodeClick passed in. I see the docs, but I like explicit declaration and symmetry with other modules
            /// also onEdgeClick isn't defined in the comment docs at the top
  }

  componentDidMount () {
    // D3NetGraph Constructor
    let el = ReactDOM.findDOMNode( this )
    let d3NetGraph = new D3NetGraph(el);
    this.setState({ d3NetGraph });
  }

  componentWillReceiveProps (nextProps) {
    // d3NetGraph gets data directly from UNISYS
  }

  shouldComponentUpdate () {
    // This prevents React from updating the component,
    // allowing D3 to handle the simulation animation updates
    // This is also necessary for D3 to handle the
    // drag events.
    return false
  }

  componentWillUpdate () {}

  render () {
    return (<div>SVG</div>)
  }

  componentDidUpdate () {}

  componentWillUnMount () {}

}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetGraph;
