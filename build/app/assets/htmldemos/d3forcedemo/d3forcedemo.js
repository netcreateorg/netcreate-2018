// UI Based on https://bl.ocks.org/steveharoz/8c3e2524079a8c440df60c1ab72b5d03

var svg = d3.select("svg"),
    width = +svg.node().getBoundingClientRect().width,
    height = +svg.node().getBoundingClientRect().height;

// svg objects
var link, node;
// the data - an object with nodes and links
var graph;					// The complete set of data
var filteredGraph;			// A subset of graph

// load the data
d3.json("data.json", function(error, _graph) {
  if (error) throw error;
  graph = _graph;
  filteredGraph = _graph;
  initializeDisplay();
  initializeSimulation();

  ShowNodes();

});



//////////// FORCE SIMULATION ////////////

// force simulator
var simulation = d3.forceSimulation();

// set up the simulation and event to update locations after each tick
function initializeSimulation() {
  simulation.nodes(filteredGraph.nodes);
  initializeForces();
  simulation.on("tick", ticked);
}

// values for all forces
forceProperties = {
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

// add forces to the simulation
function initializeForces() {
    // add forces and associate each with a name
    simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces();
}

// apply new force properties
function updateForces() {
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
        .links(forceProperties.link.enabled ? filteredGraph.edges : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}



//////////// DISPLAY ////////////

// generate the svg objects and force simulation
function initializeDisplay() {
  // set the data and properties of link lines
  link = svg.append("g")
        .attr("class", "links")
    .selectAll("line")
    .data(filteredGraph.edges)
    .enter().append("line");

  // set the data and properties of node circles
  node = svg.append("g")
        .attr("class", "nodes")
    .selectAll("circle")
    .data(filteredGraph.nodes)
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
  // visualize the graph
  updateDisplay();
}

// update the display based on the forces (but not positions)
function updateDisplay() {
    node
        .attr("r", forceProperties.collide.radius)
        .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
        .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

    link
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// update the display positions after each simulation tick
function ticked() {
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

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0.0001);
  d.fx = null;
  d.fy = null;
}

// update size-related forces
d3.select(window).on("resize", function(){
    width = +svg.node().getBoundingClientRect().width;
    height = +svg.node().getBoundingClientRect().height;
    updateForces();
});

// convenience function to update everything (run after UI input)
function updateAll() {
    updateForces();
    updateDisplay();
}



//////////// DATA DISPLAY ////////////
/******************************************************************************
	
	DATA TEMPLATE
	=============

	label 				A function for generating the display label, could be 
						based on nodeType.

	radius				A function for calculating methods

	color				A function for calculating colors, could be a lookup
						table matching nodeTypes to colors.



	BASIC DATA TYPES
	================

	There are two basic types of data: nodes and edges

		data = { 
				 nodes: [...],
				 edges: [...]
			   }

		nodes 			An array of JSON objects

		edges 			An array of JSON objects


	NODES
	=====

	Nodes have a few required objects and a number of optional objects
	that can be specific to a particular project instantiation.

	Required Parameters

		id 				A unique identifier.

		label 			A short display label, may be a calculated field.

		dateCreated		A timestamp indicating when the node was first created

		author 			A string

		attributes 		A JSON Object with any number of parameters.


	Optional Display Parameters

		radius 			Radius of the displayed node, a calculated field

		color 			Color of the displayed node, a calculated field
	
		x

		y


	EDGES
	=====

	Edges have 

	Required Parameters

		id 				A unique identifier.

		sourceID 		A reference to the id of the source node object.

		targetID 		A reference to the id of the target node object.

		dateCreated		A timestamp indicating when the node was first created

		author 			A string

		attributes 		A JSON Object with any number of parameters.

	Optional Display Parameters

		width 			Width of the line between nodes, a calculated field

		color 			Color of the line, a calculated field


******************************************************************************/
function ShowNodes () {
	// Populate Data Nodes
	var nodes = filteredGraph.nodes;
	d3.select('#data-nodes')
		.selectAll('div')
		.data(nodes)
		.enter()
		.append('div')
		.text(function(d){return d.label;});
}