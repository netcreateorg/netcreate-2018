/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    D3 without FauxDom

    Use React to create the base dom element and pass data updates,
    but D3 handles the rendering and animation updates.

    React is explicitly prevented from updating the component (see 
    shouldComponentUpdate)


    
    State & Data & D3

    The graph data is maintained locally in this.state.data.

    * The graph data is passed to the component via this.props.data.
    * We handle the new props.data in componentWillReceiveProps, setting
      this.state.data to the new props.
    * this.setState is asynchronous, so setting this.state.data to the
      nextProps value does not propagate immediately.  We have to use a
      callback on setState to update the graph after this.state.data
      is set.
    * When d3 is updated, we use `merge` to update any existing nodes
      with updated selection information.

    

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


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/



/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactDOM = require('react-dom')
const d3 = require('d3');



/// Simulation Parameters
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var simulation, svg
var linkGroup, nodeGroup
var link, node
var width = 1024
var height = 1024
var forceProperties = {   // values for all forces
      center: {
        x: 0.5,
        y: 0.5
      },
      charge: {
        enabled: true,
        strength: -20,
        distanceMin: 1,
        distanceMax: 2000
      },
      collide: {
        enabled: true,
        strength: .7,
        iterations: 1,
        radius: 4
      },
      forceX: {
        enabled: true,
        strength: .03,
        x: .5
      },
      forceY: {
        enabled: true,
        strength: .03,
        y: .5
      },
      link: {
        enabled: true,
        distance: 30,
        iterations: 1
      }
    }



/// Simulation Methods
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// initializeDisplay
//     Call this after data has been loaded
//     generate the svg objects and force simulation
//     set the data and properties of link lines
function initializeDisplay ( data ) {
  link = linkGroup
    .selectAll("line")
    .data(data.edges)
    .enter().append("line");

  // set the data and properties of node circles
  let nodeRoot = nodeGroup
    .selectAll("g")
    .data(data.nodes)

  // ENTER
  //  'node' here refers to the svg group object for each node created above
  node = nodeRoot.enter()
      .append("g")                   // svg group object for each node
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))

  // UPDATE SELECTION
  node.merge(nodeRoot).selectAll("circle")
      .attr("stroke", function(d) {
        if (d.selected) return '#000';
      })
      .attr("stroke-width", function(d) {
        if (d.selected) return '5px';
      })
  node.merge(nodeRoot).selectAll("text")
      .attr("font-weight", function(d) { if (d.selected) return 'bold'; })
      .attr("color", function(d) { if (d.selected) return '#000'; })

  // ENTER Add Group Items
  node.append("circle")
      .attr("r", function(d) { return d.size/10; })
      .attr("fill", function(d) { return d.color; })
  node.append("text")
      // .classed('noselect', true)
      .attr("font-size", 10)
      .attr("dx", 8)
      .attr("dy", ".15em")
      .text(function(d) { return d.label })
  // node tooltip
  node.append("title")
      .text(function(d) { return d.label; })

  node.exit().remove()

  updateDisplay()
}

// visualize the graph
//     update the display based on the forces (but not positions)
function updateDisplay () {
  node
      .attr("r", forceProperties.collide.radius)
      //.attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
      //.attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);
  link
      .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
      .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// Initialize Simulation
//    Call after data has been loaded
function initializeSimulation ( data ) {
  simulation.nodes( data.nodes );
  //     add forces and associate each with a name
  simulation
      .force("link", d3.forceLink())
      .force("charge", d3.forceManyBody())
      .force("collide", d3.forceCollide())
      .force("center", d3.forceCenter())
      .force("forceX", d3.forceX())
      .force("forceY", d3.forceY());
  // apply properties to each of the forces
  updateForces( data );
  simulation.on("tick", ticked);
}

// apply new force properties
function updateForces ( data ) {
    // get each force by name and update the properties
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(function(d){return d.size/forceProperties.collide.radius;})
        .iterations(forceProperties.collide.iterations);
    simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);
    simulation.force("link")
        .id(function(d) {return d.id;})
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? data.edges : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}


// update the display positions after each simulation tick
function ticked () {
  link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  node.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });

  d3.select('#alpha_value').style('flex-basis', (simulation.alpha()*100) + '%');
}


//////////// UI EVENTS ////////////

function dragstarted (d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged (d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended (d) {
  if (!d3.event.active) simulation.alphaTarget(0.0001);
  d.fx = null;
  d.fy = null;
}

// update size-related forces
// d3.select(window).on("resize", function(){
//     width = +svg.node().getBoundingClientRect().width;
//     height = +svg.node().getBoundingClientRect().height;
//     updateForces();
// });

function showNodes () {
  let data = this.state.data
  // Populate Data Nodes
  let nodes = data.nodes;
  d3.select('#data-nodes')
    .selectAll('div')
    .data(nodes)
    .enter()
    .append('div')
    .text(function(d){return d.label;});
}



/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NetGraph extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      data: null
    }
  }

  onSimDataReceived () {
    // console.error('simDataReceived',newData)
    let data = this.state.data
    if (data && data.nodes) {
      // console.error('...initializing data')
      initializeDisplay( data )
      initializeSimulation( data )
      this.showNodes( data )
    }
  }

  showNodes () {
    // console.error('......showNodes')
    let data = this.state.data
    // Populate Data Nodes
    let nodes = data.nodes;
    d3.select('#data-nodes')
      .selectAll('div')
      .data(nodes)
      .enter()
      .append('div')
      .text(function(d){return d.label;});
  }

  componentDidMount () {
    // console.log('componentDidMount')

    // Constructor
    let el = ReactDOM.findDOMNode( this )
    svg = d3.select(el).append('svg')
      .attr('width',width)
      .attr('height',height)
    
    linkGroup = svg.append("g")
        .attr("class", "links")
    nodeGroup = svg.append("g")
        .attr("class", "nodes")

    simulation = d3.forceSimulation()

  }

  componentWillReceiveProps (nextProps) {
    // console.log('componentWillReceiveProps')
    // Updates to the graph data are received here from the parent
    // component via nextProps.data
    // setState is asynchronous, so we have to wait for 
    // the state to actually be set before processing the data
    // Use a callback to update the data after state is set
    this.setState(
      {data: nextProps.data},
      this.onSimDataReceived
    )
  }
  
  shouldComponentUpdate () {
    // This prevents React from updating the component,
    // allowing D3 to handle the simulation animation updates
    // This is also necessary for D3 to handle the
    // drag events.
    //this.onSimDataReceived()
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
