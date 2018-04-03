/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    NetGraph

    This component uses React to create the base dom element and pass data 
    updates, but D3NetGraph handles the rendering and animation updates.

    React is explicitly prevented from updating the component (see 
    shouldComponentUpdate)

    

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
const React = require('react')
const ReactDOM = require('react-dom')
const D3NetGraph = require('./D3NetGraph')



/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NetGraph extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      d3NetGraph: {}
    }
  }

  componentDidMount () {
    // D3NetGraph Constructor
    let el = ReactDOM.findDOMNode( this )
    this.setState({
      d3NetGraph: new D3NetGraph( el )
    })
  }

  componentWillReceiveProps (nextProps) {
    // Updates to the graph data are received here from the parent
    // component via nextProps.data and passed on to the D3NetGraph module
    this.state.d3NetGraph.SetData( nextProps.data )
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
