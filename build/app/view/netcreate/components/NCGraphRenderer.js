/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    D3 Simple NetGraph

    This uses D3 Version 4.0.

    This is designed to work with the NetGraph React component.

    NetGraph calls SetData whenever it receives an updated data object.
    This triggers D3NetGraph to redraw itself.

    This simplified version derived from D3NetGraph.js was created to address
    a problem with links not updating properly.

    The first implementation of this removed the fancy force property settings
    that were needed to handle the realtime UI widgets in 'D3 Force Demo' app.
    Eventually these were brough back in once the link merging was debugged.
    However, this hasn't been reconciled with the `D3 Force Demo` widgets.
    It *might* work, but it *might* not.

    Zooming/panning is handled via D3's zoom() function.  Basically it
    involves creating a `g` element that wraps the node and link elements
    and applying transforms on that wrapper.

    This is based on:
    *  rdpoor's commented version of mbostock's original code
       https://gist.github.com/rdpoor/3a66b3e082ffeaeb5e6e79961192f7d8
    *  danilo's v4 update
       https://bl.ocks.org/tezzutezzu/cd04b3f1efee4186ff42aae66c87d1a7
    *  mbostock's general update pattern
       https://bl.ocks.org/mbostock/3808218
    *  Coderwall's zoom and pan method
       https://coderwall.com/p/psogia/simplest-way-to-add-zoom-pan-on-d3-js
    *  Vladyslav Babenko's zoom buttons example
       https://jsfiddle.net/vbabenko/jcsqqu6j/9/

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'NCGraphRenderer'

/* eslint-disable prefer-reflect */
/* d3.call() is false-triggering the above rule */

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const d3 = require('d3')
const UNISYS = require('unisys/client');
var UDATA = null;

/// PRIVATE VARS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_width = 800;
let m_height = 800;
let mouseoverNodeId = -1;   // id of the node the mouse is currently over
const M_FORCEPROPERTIES = {   // values for all forces
  center: {
    x: 0.5,
    y: 0.5
  },
  charge: {
    // 'charge' provides a repelling force against other nodes
    enabled: true,
    // -50 works well for small networks with no links
    strength: -200, // during _UpdateForces, 'strength' is multipled by the size of the node (degrees+1)
    // -50 close < -1000 pushes nodes far apart
    distanceMin: 1, // use 'collide' to keep nodes from intersecting, not distance
    distanceMax: 750 // max keeps large clusters from pushing unattached nodes too far away
    // 250 close < 500 med < 1000 spacious < 10000 far away
  },
  collide: {
    // 'collide' keeps nodes from overlapping each other
    // collide's `radius` value maintains a minimum distance between nodes
    enabled: true,
    strength: 0.75, // 1 keeps nodes from intersecting during drag so nodes feel more solid
    // 0.75 softens the collisions so they don't feel so jarring
    // 0.3 will allow nodes to intersect, then iterations will push them out
    iterations: 5, // need at least 3 iterations to stabilize
    // at 1 graph takes a long time to reach equilibrium
    radius: 7 // `radius` is added to node.degrees + defaultSize during _UpdateForces with the node radius
  },
  forceX: {
    // 'forceX' pushes nodes towards a normalized x position
    // x is calculated relative to the m_width
    // e.g. x=0.5 is the center
    // higher strength will push harder towards the x point
    // e.g. to create a narrow tall graph, use strength: 2
    enabled: true,
    strength: 0.25, // 1 clumped < 0.3 med  < 0.2 loose < 0.1 very loose
    x: 0.5
  },
  forceY: {
    // 'forceY' pushes nodes towards a normalized y position
    // y is calculated relative to the m_height
    // e.g. y=0.5 is the center
    // higher strength will push harder towards the y point
    // e.g. to create a wide short graph, use strength: 2
    enabled: true,
    strength: 0.25, // 1 clumped < 0.3 med  < 0.2 loose < 0.1 very loose
    y: 0.5
  },
  link: {
    enabled: true,
    distance: 50, // sets the basic link distance between nodes
    // 10 is a little too close
    // 25 is cozy
    // 50 is spacious
    // 100 leaves everything too far apart
    iterations: 5 // Orig val = 1.  More iterations will give graph time to settle
  }
}; // M_FORCEPROPERTIES



/// NCGraphRenderer CLASS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NCGraphRenderer {

  constructor(rootElement) {

    this.rootElement = rootElement;
    this.d3svg = {};
    this.zoom = {};
    this.zoomWrapper = {};
    this.simulation = {};
    this.data = { nodes: [], edges: [] };

    this.clickFn = {};

    this.nodeSizeDefault = 5; // overriden by template
    this.nodeSizeMax = 50; // overriden by template
    this.edgeSizeDefault = 0.175; // overriden by template
    this.edgeSizeMax = 50; // overriden by template

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);


    /// D3 CODE ///////////////////////////////////////////////////////////////////
    /// note: this is all inside the class constructor function!
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    this._SetDefaultValues();

    // Set up Zoom
    this.zoom = d3.zoom().on("zoom", this._HandleZoom);

  /*/ Create svg element which will contain our D3 DOM elements.
      Add default click handler so when clicking empty space, deselect all.
      NOTE: the svg element is actualy d3.selection object, not an svg obj.
  /*/ this.d3svg = d3.select(rootElement).append('svg')
      .attr('id', 'netgraph')
      .attr('width', "100%")  // maximize width and height
      .attr('height', "100%")  // then set center dynamically below
      .on("click", (e, event) => {
        // Deselect
        UDATA.LocalCall('SOURCE_SELECT', { nodeLabels: [] });
      }
      )
      .on("mouseover", (d) => {
        // Deselect edges
        mouseoverNodeId = -1;
        d3.selectAll('.edge')
          .transition()
          .duration(1500)
          .style('stroke-width', this._UpdateLinkStrokeWidth)
        d3.event.stopPropagation();
      })
      .call(this.zoom);

    this.zoomWrapper = this.d3svg.append('g').attr("class", "zoomer")

    // Set SVG size and centering.
    let svg = document.getElementById('netgraph');
    m_width = svg.clientWidth;
    m_height = svg.clientHeight;

    this.simulation = d3.forceSimulation();

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// END D3 CODE ///////////////////////////////////////////////////////////////

    // bind 'this' to function objects so event handlers can access
    // contents of this class+module instance
    this._HandleD3DataUpdate = this._HandleD3DataUpdate.bind(this);
    this._HandleTemplateUpdate = this._HandleTemplateUpdate.bind(this);
    this._ClearSVG = this._ClearSVG.bind(this);
    this._SetDefaultValues = this._SetDefaultValues.bind(this);
    this._SetData = this._SetData.bind(this);
    this._Initialize = this._Initialize.bind(this);
    this._UpdateGraph = this._UpdateGraph.bind(this);
    this.tooltipForNode = this.tooltipForNode.bind(this);
    this.displayUpdated = this.displayUpdated.bind(this);
    this._UpdateForces = this._UpdateForces.bind(this);
    this._Tick = this._Tick.bind(this);
    this._UpdateLinkStrokeWidth = this._UpdateLinkStrokeWidth.bind(this);
    this._UpdateLinkStrokeColor = this._UpdateLinkStrokeColor.bind(this);
    this._ColorMap = this._ColorMap.bind(this);
    this._ZoomReset = this._ZoomReset.bind(this);
    this._ZoomIn = this._ZoomIn.bind(this);
    this._ZoomOut = this._ZoomOut.bind(this);
    this._ZoomPanReset = this._ZoomPanReset.bind(this);
    this._HandleZoom = this._HandleZoom.bind(this);
    this._Transition = this._Transition.bind(this);
    this._Dragstarted = this._Dragstarted.bind(this);
    this._Dragged = this._Dragged.bind(this);
    this._Dragended = this._Dragended.bind(this);

    // V1.4 CHANGE
    // Ignore D3DATA Updates!!!  Only listen to FILTEREDD3DATA Updates
    //
    // watch for updates to the D3DATA data object
    // UDATA.OnAppStateChange('D3DATA',(data)=>{
    //   // expect { nodes, edges } for this namespace
    //   if (DBG) console.error(PR,'got state D3DATA',data);
    //   this._SetData(data);
    // });

    // V2.0 CHANGE
    // Ignore FILTEREDD3DATA updates!  Only listen for SYNTHESIZEDD3DATA
    // which represents simplified edge data (duplicate edges removed) for rendering
    // UDATA.OnAppStateChange('FILTEREDD3DATA', this._HandleFilteredD3DataUpdate);

    UDATA.OnAppStateChange('SYNTHESIZEDD3DATA', this._HandleD3DataUpdate);
    UDATA.OnAppStateChange('TEMPLATE', this._HandleTemplateUpdate);
    UDATA.OnAppStateChange('COLORMAP', this._ColorMap);
    UDATA.HandleMessage('ZOOM_RESET', this._ZoomReset);
    UDATA.HandleMessage('ZOOM_IN', this._ZoomIn);
    UDATA.HandleMessage('ZOOM_OUT', this._ZoomOut);
    UDATA.HandleMessage('ZOOM_PAN_RESET', this._ZoomPanReset);
    // UDATA.HandleMessage('GROUP_PROPS', (data) => {
    //   console.log('GROUP_PROPS got ... ');
    // });



  }


  /// CLASS PUBLIC METHODS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Deregister() {
    if (DBG) console.log(PR, 'd3-simplenetgraph.DESTRUCT!!!')
    UDATA.AppStateChangeOff('SYNTHESIZEDD3DATA', this._HandleD3DataUpdate);
    UDATA.AppStateChangeOff('COLORMAP', this._ColorMap);
    UDATA.UnhandleMessage('ZOOM_RESET', this._ZoomReset);
    UDATA.UnhandleMessage('ZOOM_IN', this._ZoomIn);
    UDATA.UnhandleMessage('ZOOM_OUT', this._ZoomOut);
    UDATA.UnhandleMessage('ZOOM_PAN_RESET', this._ZoomPanReset);
  }

  /// CLASS PRIVATE METHODS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   *
   * @param {object} data
   * @param {array} data.nodes
   * @param {array} data.edges
   */
  _HandleD3DataUpdate(data) {
    if (DBG) console.log(PR, 'got state D3DATA', data);
    this._SetData(data);
  }

  /*/ Update default values when template has changed
  /*/
  _HandleTemplateUpdate(data) {
    if (DBG) console.log(PR, 'got state TEMPLATE', data);
    this._SetDefaultValues();
  }

  /*/ Clear the SVG data
      Currently not used because we just deconstruct d3-simplenetgraph insead.
      Was thought to be needed during imports otherwise _UpdateGraph reads data from existing
      SVG elements rather than the new data.
  /*/
  _ClearSVG() {
    this.zoomWrapper.selectAll(".edge").remove();
    this.zoomWrapper.selectAll(".node").remove();
  }


  /*/ Set default node and edge size values from TEMPLATE
  /*/
  _SetDefaultValues() {
    const TEMPLATE = UDATA.AppState("TEMPLATE");
    this.nodeSizeDefault = TEMPLATE.nodeSizeDefault;
    this.nodeSizeMax = TEMPLATE.nodeSizeMax;
    this.edgeSizeDefault = TEMPLATE.edgeSizeDefault;
    this.edgeSizeMax = TEMPLATE.edgeSizeMax;
  }

  /*/ The parent container passes data to the d3 graph via this SetData call
      which then triggers all the internal updates
  /*/
  _SetData(newData) {
    if (newData) {
      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      // From https://observablehq.com/@d3/modifying-a-force-directed-graph?collection=@d3/d3-force
      // grab the SVG nodes
      const svgNodes = this.zoomWrapper.selectAll(".node");
      const oldNodes = new Map(svgNodes.data().map(d => [d.id, d]));

      this.data.nodes = newData.nodes.map(d => Object.assign(oldNodes.get(d.id) || {}, d));
      this.data.edges = newData.edges.map(d => Object.assign({}, d));

      this._Initialize()
      this._UpdateForces()
      this._UpdateGraph()

      // updates ignored until this is run restarts the simulation
      // (important if simulation has already slowed down)
      this.simulation.alpha(0.3).restart()  // was 1 - JD
    }
  }

/*/ This sets up the force properties for the simulation and tick handler.
/*/ _Initialize() {
    // Create the force layout.  After a call to force.start(), the tick
    // method will be called repeatedly until the layout "gels" in a stable
    // configuration.
    this.simulation
      .force("link", d3.forceLink())
      .force("charge", d3.forceManyBody())
      .force("collide", d3.forceCollide())
      .force("center", d3.forceCenter())
      .force("forceX", d3.forceX())
      .force("forceY", d3.forceY())

      .on("tick", this._Tick)
  }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Call _UpdateGraph() after new data has been loaded. This creates link and node
    svg objects and sets their forceProperties.
    The component `node` structure:
        <g class="node">  // node group object
           <circle>
           <text>         // label
           <title>        // tooltip
        </g>

    This method implements the unified enter/exit/update pattern described
    here: http://d3indepth.com/enterexit/#general-update-pattern

    By convention, selection methods that return the current selection use
    four spaces of indent, while methods that return a new selection use only two.
    This helps reveal changes of context by making them stick out of the chain.

    This method actually does more than just "update" an existing graph; in D3
    you can write code that initializes AND updates data.

/*/ _UpdateGraph() {
    const COLORMAP = UDATA.AppState('COLORMAP');

    // DATA JOIN
    // select all elemnts with class .node in d3svg
    // bind selected elements with elements in this.data.nodes,
    // assigning each one an id using the key function.

    // nodeElements is a d3.selection object
    let nodeElements = this.zoomWrapper.selectAll(".node")
      .data(this.data.nodes, (d) => { return d.id }); // fn returns the calculated key for the data object

    // linkElements is a d3.selection object
    let linkElements = this.zoomWrapper.selectAll(".edge")
      .data(this.data.edges, (d) => { return d.id }); // fn returns the calculated key for the data object


    // TELL D3 HOW TO HANDLE NEW NODE DATA
    // the d3.selection.enter() method sets the operational scope for
    // subsequent calls
    let elementG = nodeElements.enter()
      .append("g")
      .classed('node', true);

    // enter node: append 'g' (group) element and click behavior
    elementG
      .call(d3.drag()
        .on("start", (d) => { this._Dragstarted(d, this) })
        .on("drag", this._Dragged)
        .on("end", (d) => { this._Dragended(d, this) }))
      .on("click", (d) => {
        if (DBG) console.log('clicked on', d.label, d.id)
        UDATA.LocalCall('SOURCE_SELECT', { nodeIDs: [d.id] });
        d3.event.stopPropagation();
      })
      .on("mouseover", (d) => {
        mouseoverNodeId = d.id;
        d3.selectAll('.edge')
          .transition()
          .duration(500)
          .style('stroke-width', this._UpdateLinkStrokeWidth)
        d3.event.stopPropagation();
      })

    // enter node: also append 'circle' element of a calculated size
    elementG
      .append("circle")
      // "r" has to be set here or circles don't draw.
      .attr("r", (d) => {
        return Math.min(this.nodeSizeDefault + d.degrees, this.nodeSizeMax);
      })
      //        .attr("r", (d) => { return this.defaultSize }) // d.size ?  d.size/10 : this.defaultSize; })
      .attr("fill", (d) => {
        // REVIEW: Using label match.  Should we use id instead?
        // The advantage of using the label is backward compatibility with
        // Google Fusion table data as well as exportability.
        // If we save the type as an id, the data format will be
        // less human-readable.
        // The problem with this approach though is that any changes
        // to the label text will result in a failed color lookup!
        return COLORMAP.nodeColorMap[d.type];
      })
      .style("opacity", d => {
        return d.filteredTransparency
      });

    // enter node: also append 'text' element
    elementG
      .append("text")
      .classed('noselect', true)
      .attr("font-size", 10)
      .attr("dx", (d => { return this.nodeSizeDefault + 5 })) // 8)
      .attr("dy", "0.35em") // ".15em")
      .text((d) => { return d.label })
      .style("opacity", d => {
        return d.filteredTransparency
      });

    // enter node: also append a 'title' tag
    // we should move this to our tooltip functions, but it works for now
    elementG
      .append("title") // node tooltip
      .text((d) => {
        return this.tooltipForNode(d);
      });

    /*/ TRICKY D3 CODE CONCEPTS AHEAD

        CONTEXT: The author of this code has assumed that NCDATA may
        completely changed, so his update code is written with this in mind.

        At this point in the code, nodeElements is operating on the enter()
        selection set (remember: nodeElements is a REFERENCE to the
        original d3 selection object, which is being transmutted by every
        operation).

        Given the above, .merge() will combine the current active d3
        selection (enter()) with all the nodes (nodeEntry in its entirety).

        It may seem weird because:

        (1) the d3.selection() context isn't always obvious unless you
            know that d3.selections and key ops like .enter(), .update(),
            and .exit() affect certain other ops.
        (2) this code reads like it's executing immediately on nodeElements,
            but it actually is a PROGRAM being defined for a d3.selection
            event that runs later. The value of the parameter nodeElements
            will have a different value in the future than it does at the
            time of definition here.

        In effect, the merge() operation is used to use the same
        initialization code for both enter() and manual refresh.

        ASIDE: There is an d3.selection.update() operation, but that  is
        called when d3 detects that data node bound to an existing DOM
        element has changed. This code doesn't use update(), and instead
        relies on manual event detection to force a full data refresh and
        update. D3 doesn't die because it is aware of the persistent SVG
        elements  it created, and checks data binding through the id. This
        is fast, and the SVG elements do not have to be recreated.

    /*/

    // UPDATE circles in each node for all nodes
    nodeElements.merge(nodeElements)
      .selectAll("circle")
      .attr("stroke", (d) => {
        if (d.selected) return d.selected;
        if (d.strokeColor) return d.strokeColor;
        return undefined; // don't set stroke color
      })
      .attr("stroke-width", (d) => {
        if (d.selected || d.strokeColor) return '5px';
        return undefined // don't set stroke width
      })
      .attr("fill", (d) => {
        return COLORMAP.nodeColorMap[d.type];
      })
      .attr("r", (d) => {
        // this "r" is necessary to resize after a link is added
        return Math.min(this.nodeSizeDefault + d.degrees, this.nodeSizeMax);
      })
      .transition()
      .duration(500)
      .style("opacity", d => {
        // console.log(d);
        return d.filteredTransparency
      });

    // UPDATE text in each node for all nodes
    // (technically this could have proceeded from the previous operation,
    // but this makes it a little easier to findthe text-specific code as
    // a block
    nodeElements.merge(nodeElements)
      .selectAll("text")
      .attr("color", (d) => {
        if (d.selected) return d.selected;
        return undefined; // don't set color
      })
      .attr("font-weight", (d) => {
        if (d.selected) return 'bold';
        return undefined; // don't set font weight
      })
      .text((d) => { return d.label }) // in case text is updated
      .transition()
      .duration(500)
      .style("opacity", d => {
        return d.filteredTransparency
      });

    nodeElements.merge(nodeElements)
      .selectAll("title") // node tooltip
      .text((d) => {
        return this.tooltipForNode(d);
      });
    // TELL D3 what to do when a data node goes away
    nodeElements.exit().remove()

    // NOW TELL D3 HOW TO HANDLE NEW EDGE DATA
    // .insert will add an svg `line` before the objects classed `.node`
    // .enter() sets the initial state of links as they are created
    linkElements.enter()
      .insert("line", ".node")
      .classed('edge', true)
      .style('stroke', this._UpdateLinkStrokeColor)
      // .style('stroke', 'rgba(0,0,0,0.1)')  // don't use alpha unless we're prepared to handle layering -- reveals unmatching links
      .style('stroke-width', this._UpdateLinkStrokeWidth)
      // old stroke setting
      // .style('stroke-width', (d) => { return d.size**2 } )    // Use **2 to make size differences more noticeable
      // Edge selection disabled.
      // .on("click",   (d) => {
      //   if (DBG) console.log('clicked on',d.label,d.id)
      //   this.edgeClickFn( d )
      // })
      .style("opacity", d => {
        return d.filteredTransparency
      });

    // .merge() updates the visuals whenever the data is updated.
    linkElements.merge(linkElements)
      .classed("selected", (d) => { return d.selected })
      .style('stroke', this._UpdateLinkStrokeColor)
      .style('stroke-width', this._UpdateLinkStrokeWidth)
      .transition()
      .duration(500)
      .style("opacity", d => {
        return d.filteredTransparency
      });

    linkElements.exit().remove()

    // UPDATE ANIMATED SIMULATION
    // this is a plugin
    this.simulation.nodes(this.data.nodes)
    if (this.data.edges) {
      this.simulation.force("link").links(this.data.edges)
    }
  }

  // added by Joshua to generate the text, based on the template, for the tooltip on the node
  tooltipForNode(d) {
    const nodeDefs = UDATA.AppState("TEMPLATE").nodeDefs;
    let titleText = "";
    if (nodeDefs.label.includeInGraphTooltip !== undefined) {
      // Add Label
      if (nodeDefs.label.includeInGraphTooltip) titleText += nodeDefs.label.displayLabel + ": " + d.label + "\n";
      // Add type
      if (nodeDefs.type.includeInGraphTooltip) titleText += nodeDefs.type.displayLabel + ": " + d.type + "\n";
      // Add degrees
      if (nodeDefs.degrees.includeInGraphTooltip) titleText += nodeDefs.degrees.displayLabel + ": " + d.degrees + "\n";
      // Add notes
      if (nodeDefs.notes.includeInGraphTooltip) titleText += nodeDefs.notes.displayLabel + ": " + d.notes + "\n";
      // Add info
      if (nodeDefs.info.includeInGraphTooltip) titleText += nodeDefs.info.displayLabel + ": " + d.info + "\n";
      // Add updated info
      if (nodeDefs.updated.includeInGraphTooltip) titleText += nodeDefs.updated.displayLabel + ": " + this.displayUpdated(d);
    } else {
      // For backwards compatability
      titleText += nodeDefs.displayLabel.label + ": " + d.label + "\n";
    }
    return titleText;
  }

  displayUpdated(nodeEdge) {
    const d = new Date(nodeEdge.meta.revision > 0 ? nodeEdge.meta.updated : nodeEdge.meta.created);
    const year = String(d.getFullYear());
    const date = (d.getMonth() + 1) + "/" + d.getDate() + "/" + year.substr(2, 4);
    const time = d.toTimeString().substr(0, 5);
    const author = nodeEdge._nlog ? nodeEdge._nlog[nodeEdge._nlog.length - 1] : 'unknown';
    const dateTime = date + ' at ' + time + " by " + author;
    return dateTime;
  }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Apply new force properties
    Call this on construct and if forceProperties have changed.
/*/ _UpdateForces() {
    this.simulation
      .force("link", d3.forceLink()
        .id(d => d.id) // note `d` is an edge, not a node
        // all edges use the same link distance, charge is what pushes them apart
        .distance(M_FORCEPROPERTIES.link.distance)
        .iterations(M_FORCEPROPERTIES.link.iterations))
      .force("charge", d3.forceManyBody()
        // the larger the node, the harder it pushes
        .strength(d => (this.nodeSizeDefault + d.degrees) * M_FORCEPROPERTIES.charge.strength * M_FORCEPROPERTIES.charge.enabled)
        .distanceMin(M_FORCEPROPERTIES.charge.distanceMin)
        .distanceMax(M_FORCEPROPERTIES.charge.distanceMax))
      .force("collide", d3.forceCollide()
        .strength(M_FORCEPROPERTIES.collide.strength * M_FORCEPROPERTIES.collide.enabled)
        // node radius (defaultSize+degrees) + preset radius keeps nodes separated
        // from each other like bouncing balls
        .radius(d => this.nodeSizeDefault + d.degrees + M_FORCEPROPERTIES.collide.radius)
        .iterations(M_FORCEPROPERTIES.collide.iterations))
      .force("center", d3.forceCenter()
        .x(m_width * M_FORCEPROPERTIES.center.x)
        .y(m_height * M_FORCEPROPERTIES.center.y))
      .force("forceX", d3.forceX()
        .strength(M_FORCEPROPERTIES.forceX.strength * M_FORCEPROPERTIES.forceX.enabled)
        .x(m_width * M_FORCEPROPERTIES.forceX.x))
      .force("forceY", d3.forceY()
        .strength(M_FORCEPROPERTIES.forceY.strength * M_FORCEPROPERTIES.forceY.enabled)
        .y(m_height * M_FORCEPROPERTIES.forceY.y))
  }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update the display positions after each simulation tick

    This tick method is called repeatedly until the layout stabilizes.

    NOTE: the order in which we update nodes and links does NOT determine which
    gets drawn first -- the drawing order is determined by the ordering in the
    DOM.  See the notes under link_update.enter() above for one technique for
    setting the ordering in the DOM.
/*/ _Tick() {
    // Drawing the nodes: Update the location of each node group element
    // from the x, y fields of the corresponding node object.
    this.zoomWrapper.selectAll(".node")
      .attr("transform", (d) => { return "translate(" + d.x + "," + d.y + ")" })

    // Drawing the links: Update the start and end points of each line element
    // from the x, y fields of the corresponding source and target node objects.
    this.zoomWrapper.selectAll(".edge")
      .attr("x1", (d) => { return d.source.x; })
      .attr("y1", (d) => { return d.source.y; })
      .attr("x2", (d) => { return d.target.x; })
      .attr("y2", (d) => { return d.target.y; })
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Sets the width of the links during update cycles
      Used by linElements.enter() and linkElements.merge()
      and mouseover events.
  /*/
  _UpdateLinkStrokeWidth(edge) {
    if (DBG) console.log(PR, '_UpdateLinkStrokeWidth', edge);
    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
    if (edge.selected ||
      (mouseoverNodeId === -1) ||
      (sourceId === mouseoverNodeId) ||
      (targetId === mouseoverNodeId)
    ) {
      // max size checking is in edge-logic
      return edge.size;
      // return edge.size ** 2;  // Use **2 to make size differences more noticeable
      // return Math.min(edge.size ** 2, this.edgeSizeMax);  // Use **2 to make size differences more noticeable
    } else {
      return this.edgeSizeDefault;             // Barely visible if not selected
    }
  }

  /// Edge color is pre-set by edge-logic based on weights
  _UpdateLinkStrokeColor(edge) {
    return edge.color;
  }


  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // The template may be loaded or changed after NCDATA is loaded.
  // So we need to explicitly update the colors if the color
  // definitions have changed.
  _ColorMap(data) {
    if (DBG) console.log(PR, 'got state COLORMAP', data);
    this._UpdateGraph();
  }

  _ZoomReset(data) {
    if (DBG) console.log(PR, 'ZOOM_RESET got state NCDATA', data);
    // NOTE: The transition/duration call means _HandleZoom will be called multiple times
    this.d3svg.transition()
      .duration(200)
      .call(this.zoom.scaleTo, 1);
  }

  _ZoomIn(data) {
    if (DBG) console.log(PR, 'ZOOM_IN got state NCDATA', data);
    this._Transition(1.2);
  }

  _ZoomOut(data) {
    if (DBG) console.log(PR, 'ZOOM_OUT got state NCDATA', data);
    this._Transition(0.8);
  }

  // Pan to 0,0 and zoom scale to 1
  // (Currently not used)
  _ZoomPanReset(data) {
    if (DBG) console.log(PR, 'ZOOM_PAN_RESET got state NCDATA', data);
    const transform = d3.zoomIdentity.translate(0, 0).scale(1);
    this.d3svg.call(this.zoom.transform, transform);
  }

  /*/ This primarily handles mousewheel zooms
  /*/
  _HandleZoom() {
    if (DBG) console.log(PR, '_HandleZoom')
    d3.select('.zoomer').attr("transform", d3.event.transform);
  }
  /*/ This handles zoom button zooms.
  /*/
  _Transition(zoomLevel) {
    if (DBG) console.log(PR, '_Transition')
    this.d3svg.transition()
      //.delay(100)
      .duration(200)
      .call(this.zoom.scaleBy, zoomLevel);
  }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ _Dragstarted(d, self) {
    if (DBG) console.log(PR, '_Dragstarted', d.x, d.y)
    if (!d3.event.active) self.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ _Dragged(d) {
    if (DBG) console.log(PR, '_Dragged')
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ _Dragended(d, self) {
    if (DBG) console.log(PR, '_Dragended')
    if (!d3.event.active) self.simulation.alphaTarget(0.0001);
    d.fx = null;
    d.fy = null;
  }
  // update window size-related forces
  // d3.select(window).on("resize", (){ =>
  //     width = +svg.node().getBoundingClientRect().width;
  //     height = +svg.node().getBoundingClientRect().height;
  //     updateForces();
  // });
} // class D3NetGraph

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCGraphRenderer
