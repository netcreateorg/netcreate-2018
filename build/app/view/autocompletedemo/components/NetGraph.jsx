/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    BL NOTES
    
    https://lab.oli.me.uk/react-faux-dom-state/
    This article suggests that maybe using force graphs with react-faux-dom
    not quite work.
        "If you want to animate things, use a React animation library (they’re
         great and work fine with faux DOM), you have to find the React way to 
         do things, sadly some D3 concepts just don’t translate. If you want 
         some physics based graph full of state then you’re probably better 
         off keeping to the original way of embedding D3 in React, dropping 
         out of React and letting D3 mutate that element."



    EXAMPLE USE OF REACT-FAUX-DOM
    https://codesandbox.io/s/github/tibotiber/rfd-animate-example/tree/master/

    This is an example use of react-faux-dom. React provides the UI
    scaffolding. How does it work?

    (1) the component is exported through withFauxDOM( Component ),
    which adds several new methods to props for use during the lifecycle.

    (2) D3 makes the faux element available to react as a prop through
    this call at the beginning of componentDidMount()
      var faux = this.props.connectFauxDOM('div', 'chart')
    where 'div' is the element to create, and 'chart' is what is stored
    as a prop (see step 4)

    (3) Use the faux DOM element with D3 using D3 conventions.

    (4) render() with {this.props.chart} in the JSX wrapper.

    You can have multiple faux nodes to D3 with! See the docs for
    react-faux-dom connectFauxDOM().

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/



/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const d3 = require('d3');
const { withFauxDOM } = require('react-faux-dom');

var simulation, svg;
var link, node;
var width = 1024
var height = 1024

// values for all forces
var forceProperties = {
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


// initializeDisplay
// Call this after data has been loaded
// generate the svg objects and force simulation
// set the data and properties of link lines
function initializeDisplay ( data ) {
  link = svg.append("g")
        .attr("class", "links")
    .selectAll("line")
    .data(data.edges)
    .enter().append("line");

  // set the data and properties of node circles
  node = svg.append("g")
        .attr("class", "nodes")
    .selectAll("circle")
    .data(data.nodes)
    .enter()
        .append("g")                   // svg group object for each node
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
  // node here refers to the svg group object for each node created above
  node.append("circle")
      .attr("r", function(d) { return d.size/10; })
      .attr("fill", function(d) { return d.color; });
  node.append("text")
      // .classed('noselect', true)
      .attr("font-size", 10)
      .attr("dx", 8)
      .attr("dy", ".15em")
      .text(function(d) { return d.label });
  // node tooltip
  node.append("title")
      .text(function(d) { return d.label; });

  updateDisplay()
}

// visualize the graph
// update the display based on the forces (but not positions)
function updateDisplay () {
  node
      .attr("r", forceProperties.collide.radius)
      .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
      .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

  link
      .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
      .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// Initialize Simulation
// Calla fter data has been loaded
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
  console.log('ticked')
  link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  node.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });

  // old transform code that doesn't work with text
  // and new "g" element
  // node
  //     .attr("cx", function(d) { return d.x; })
  //     .attr("cy", function(d) { return d.y; });
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

function ShowNodes ( data ) {
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
  }

  render () {
    return (
      <div>
        SVG
        {this.props.netgraph}
      </div>
    )
  }

  onSimDataReceived (data) {
    initializeDisplay( data )
    initializeSimulation( data )
    ShowNodes( data )
  }

  componentDidMount () {
    console.error('componentDidMount')
    // This will create a faux div and store its virtual DOM
    // in state.netgraph
    const faux = this.props.connectFauxDOM('div', 'netgraph')

    svg = d3.select(faux).append('svg')
      .attr('width',width)
      .attr('height',height)

    simulation = d3.forceSimulation()

    this.props.animateFauxDOM(2000)
  }

  componentWillReceiveProps (nextProps) {
    console.error('componentWillReceiveProps')
    if (nextProps && (nextProps.data != this.props.data) ) {
      console.error('...updating props!')
      this.setState( {data: nextProps.data} )
      this.onSimDataReceived( nextProps.data )
    }
  }

  componentDidUpdate () {
    console.log('componentDidUpdate')
    // Only update if this.props.data has been received
    if (this.props.data===undefined || this.props.data.nodes===undefined) {
      console.log('...no props yet, aborting')
      return
    }
    console.log('...props received')
    
  }


}

NetGraph.defaultProps = {
  netgraph: 'loading'
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FauxNetGraph = withFauxDOM(NetGraph);
module.exports = FauxNetGraph;
