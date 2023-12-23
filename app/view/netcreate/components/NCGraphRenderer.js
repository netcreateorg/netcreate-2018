/* eslint-disable prefer-reflect */
/* d3.call() is false-triggering the above rule */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NCGraphRenderer

  This uses D3 Version 4.0.

  This is a pure data renderer based on d3-simplenetgraph.
  It does not rely on any outside data sources/dependencies or UNISYS calls.

  The one exception is that `mouseover` and `node click` events are
  broadcast through UNISYS calls.

  This is designed to work with the NCGraph React component.

  NCGraph calls NCGraphRenderer.SetData whenever it receives an updated data object.
  This triggers NCGraphRenderer to redraw itself.

  VDATA
  -----
  The data for display is generally referred to as VDATA, for visual
  rendering data.

    VDATA = { nodes:Object, edges:Object }
    nodes = [ ...{ id :number,
                    label :string,
                    selected :boolean,
                    selectedSecondary :boolean,  // for selected source/target node
                    size :number,
                    color :string(css),
                    opacity :number(0-1),
                    strokeColor :string(css),
                    strokeWidth :number,
                    textColor :string(css),
                    help :string
                  }],
    edges = [ ...{ id :number,
                    sourceId :number,
                    targetId :number,
                    size: number,
                    color: string(css),
                    opacity: number(0-1)
                  }]


  Using NCGraphRenderer
  ---------------------
  Embed NCGraphRender in a parent component.  See NCGraph for an example of use.
  1. const graph = NCGraphRender(this.dom) -- Root element to attach the SVG graph to
  2. graph.SetData(VDATA) -- Define data to draw
      graph.UpdateGraph()   -- Force a redraw using the loaded data set

  External Controls
  * graph.ZoomReset()
  * graph.ZoomIn()
  * graph.ZoomOut()


  Zoom/Pan
  --------
  Zooming/panning is handled via D3's zoom() function.  Basically it
  involves creating a `g` element that wraps the node and link elements
  and applying transforms on that wrapper.


  Provenance
  ----------
  d3-simplenetgraph was based on:
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

const d3 = require('d3');
const UNISYS = require('unisys/client');
var UDATA = null;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCGraphRenderer';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_width = 800;
let m_height = 800;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const M_FORCEPROPERTIES = {
  // values for all forces
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

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// D3 CODE ///////////////////////////////////////////////////////////////////
    /// note: this is all inside the class constructor function!
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // this.UpdateDefaultValues(); // needs TEMPLATE

    // Set up Zoom
    this.zoom = d3.zoom().on('zoom', this.m_HandleZoom);

    /** Create svg element which will contain our D3 DOM elements.
        Add default click handler so when clicking empty space, deselect all.
        NOTE: the svg element is actualy d3.selection object, not an svg obj.
     */
    this.d3svg = d3
      .select(rootElement)
      .append('svg')
      .attr('id', 'netgraph')
      .attr('width', '100%') // maximize width and height
      .attr('height', '100%') // then set center dynamically below
      .on('click', (e, event) => {
        // Deselect
        UDATA.LocalCall('D3_SELECT_NODE', { nodeLabels: [] });
        // DEPRECATED for now 7/2023 -- use D3_SELECT_NODE instead
        // UDATA.LocalCall('SOURCE_SELECT', { nodeLabels: [] });
      })
      .on('mouseover', d => {
        UDATA.LocalCall('USER_HILITE_NODE', { nodeId: undefined });
        // Deselect edges
        d3.selectAll('.edge')
          .transition()
          .duration(1500)
          .style('stroke-width', e => e.width);
        d3.event.stopPropagation();
      })
      .call(this.zoom);

    this.zoomWrapper = this.d3svg.append('g').attr('class', 'zoomer');

    // Set SVG size and centering.
    let svg = document.getElementById('netgraph');
    m_width = svg.clientWidth;
    m_height = svg.clientHeight;

    this.simulation = d3.forceSimulation();

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// END D3 CODE ///////////////////////////////////////////////////////////////

    this.ClearSVG = this.ClearSVG.bind(this);
    this.SetData = this.SetData.bind(this);
    this.m_Initialize = this.m_Initialize.bind(this);
    this.UpdateGraph = this.UpdateGraph.bind(this);
    this.m_UpdateForces = this.m_UpdateForces.bind(this);
    this.m_Tick = this.m_Tick.bind(this);
    this.ZoomReset = this.ZoomReset.bind(this);
    this.ZoomIn = this.ZoomIn.bind(this);
    this.ZoomOut = this.ZoomOut.bind(this);
    this.ZoomPanReset = this.ZoomPanReset.bind(this);
    this.m_HandleZoom = this.m_HandleZoom.bind(this);
    this.m_Transition = this.m_Transition.bind(this);
    this.m_Dragstarted = this.m_Dragstarted.bind(this);
    this.m_Dragged = this.m_Dragged.bind(this);
    this.m_Dragended = this.m_Dragended.bind(this);
  }

  /// CLASS PUBLIC METHODS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  Deregister() {
    if (DBG) console.log(PR, 'NCGraphRenderer.DESTRUCT!!!');
    // Take care of any de-registration of listeners...
    // ...there aren't any at the moment...
  }

  /// CLASS PRIVATE METHODS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** Clear the SVG data
      Currently not used because we just deconstruct d3-simplenetgraph insead.
      Was thought to be needed during imports otherwise _UpdateGraph reads data from existing
      SVG elements rather than the new data.
   */
  ClearSVG() {
    this.zoomWrapper.selectAll('.edge').remove();
    this.zoomWrapper.selectAll('.node').remove();
  }

  /** The parent container passes data to the d3 graph via this SetData call
   *  which then triggers all the internal updates
   *
   *  When a SELECTION is updated, we use skipForceUpdate to preven the
   *  simulation from re-applying forces, causing nodes to move.  Without this
   *  as you mouseover a node, ALL the nodes move and it becomes impossible to
   *  select the node.
   *  @param {Object} newData VDATA { nodes, edges }
   *  @param {Object} options
   *  @param {boolean} options.skipForceUpdate skip force updates during selection updates
   */
  SetData(newData, options = {}) {
    if (newData) {
      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      // From https://observablehq.com/@d3/modifying-a-force-directed-graph?collection=@d3/d3-force
      // grab the SVG nodes
      const svgNodes = this.zoomWrapper.selectAll('.node');
      const oldNodes = new Map(svgNodes.data().map(d => [d.id, d]));

      this.data.nodes = newData.nodes.map(d =>
        Object.assign(oldNodes.get(d.id) || {}, d)
      );
      this.data.edges = newData.edges.map(d => Object.assign({}, d));

      // FIXME: REVIEW: is this not necessary?  Just check initialize once?
      if (!options.skipForceUpdate) this.m_Initialize();
      if (!options.skipForceUpdate) this.m_UpdateForces();
      this.UpdateGraph(options.skipForceUpdate);

      // updates ignored until this is run restarts the simulation
      // (important if simulation has already slowed down)
      // skipForceUpdate here is helpful for preventing force updates when hovering
      // or tryng to select an object.
      if (!options.skipForceUpdate) this.simulation.alpha(0.1).restart(); // was 1 - JD
    }
  }

  /** This sets up the force properties for the simulation and tick handler.
   */
  m_Initialize() {
    // Create the force layout.  After a call to force.start(), the tick
    // method will be called repeatedly until the layout "gels" in a stable
    // configuration.
    this.simulation
      .force('link', d3.forceLink())
      .force('charge', d3.forceManyBody())
      .force('collide', d3.forceCollide())
      .force('center', d3.forceCenter())
      .force('forceX', d3.forceX())
      .force('forceY', d3.forceY())

      .on('tick', this.m_Tick);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Call UpdateGraph() after new data has been loaded. This creates link and node
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
   */
  UpdateGraph() {
    // DATA JOIN
    // select all elemnts with class .node in d3svg
    // bind selected elements with elements in this.data.nodes,
    // assigning each one an id using the key function.

    // nodeElements is a d3.selection object
    let nodeElements = this.zoomWrapper
      .selectAll('.node')
      .data(this.data.nodes, d => {
        return d.id;
      }); // fn returns the calculated key for the data object

    // linkElements is a d3.selection object
    let linkElements = this.zoomWrapper
      .selectAll('.edge')
      .data(this.data.edges, d => {
        return d.id;
      }); // fn returns the calculated key for the data object

    // TELL D3 HOW TO HANDLE NEW NODE DATA
    // the d3.selection.enter() method sets the operational scope for
    // subsequent calls
    let elementG = nodeElements.enter().append('g').classed('node', true);

    // enter node: append 'g' (group) element and click behavior
    elementG
      .call(
        d3
          .drag()
          .on('start', d => {
            this.m_Dragstarted(d, this);
          })
          .on('drag', this.m_Dragged)
          .on('end', d => {
            this.m_Dragended(d, this);
          })
      )
      .on('click', d => {
        if (DBG) console.log('clicked on', d.label, d.id);
        UDATA.LocalCall('D3_SELECT_NODE', { nodeIDs: [d.id] });
        // DEPRECATED for now 7/2023 -- use D3_SELECT_NODE instead
        // UDATA.LocalCall('SOURCE_SELECT', { nodeIDs: [d.id] });
        d3.event.stopPropagation();
      })
      .on('mouseover', d => {
        UDATA.LocalCall('USER_HILITE_NODE', { nodeId: d.id });
        d3.selectAll('.edge')
          .transition()
          .duration(500)
          .style('stroke-width', e => e.width);
        d3.event.stopPropagation();
      });

    // enter node: also append 'circle' element of a calculated size
    elementG
      .append('circle')
      .attr('r', d => d.size) // "r" has to be set here or circles don't draw.
      .attr('fill', d => d.color)
      .style('opacity', d => d.opacity);

    // EXPERIMENTAL: Show rectangle shapes
    // REVIEW: Is there a way not to create this if it's not needed?
    // elementG
    //   .append('rect')
    //   .attr('width', d => d.size * 2)
    //   .attr('height', d => d.size * 2)
    //   .attr('x', d => -d.size)
    //   .attr('y', d => -d.size)
    //   .attr('fill', d => d.color)
    //   .style('opacity', 0);

    // enter node: also append 'text' element
    elementG
      .append('text')
      .classed('noselect', true)
      .attr('font-size', 10)
      .attr('dx', d => d.size + 5)
      .attr('dy', '0.35em') // ".15em")
      .text(d => d.label)
      .style('opacity', d => d.opacity);

    // enter node: also append a 'title' tag
    // we should move this to our tooltip functions, but it works for now
    elementG
      .append('title') // node tooltip
      .text(d => d.help);

    /** TRICKY D3 CODE CONCEPTS AHEAD

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

     */

    // UPDATE circles in each node for all nodes
    nodeElements
      .merge(nodeElements)
      .selectAll('circle')
      .attr('stroke', d => d.strokeColor)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('fill', d => d.color)
      .attr('r', d => d.size)
      .transition()
      .duration(500)
      .style('opacity', d => d.opacity);

    // UPDATE text in each node for all nodes
    // (technically this could have proceeded from the previous operation,
    // but this makes it a little easier to findthe text-specific code as
    // a block
    nodeElements
      .merge(nodeElements)
      .selectAll('text')
      .attr('fill', d => d.textColor)
      // .attr('stroke', d => d.strokeColor) // stroke overlaps on text
      // .attr('stroke-width', '0.5px') // stroke overlaps on text
      .attr('font-weight', d => {
        return d.strokeColor ? 'bold' : undefined;
      })
      .text(d => d.label) // in case text is updated
      .transition()
      .duration(500)
      .style('opacity', d => d.opacity);

    nodeElements
      .merge(nodeElements)
      .selectAll('title') // node tooltip
      .text(d => d.help);

    // EXPERIMENTAL: Show rectangle shapes
    // nodeElements
    //   .merge(nodeElements)
    //   .selectAll('rect')
    //   .attr('stroke', d => d.strokeColor)
    //   .attr('stroke-width', d => d.strokeWidth)
    //   .style('opacity', d => d.shape === 'rectangle' ? 1 : 0);

    // TELL D3 what to do when a data node goes away
    nodeElements.exit().remove();

    // NOW TELL D3 HOW TO HANDLE NEW EDGE DATA
    // .insert will add an svg `line` before the objects classed `.node`
    // .enter() sets the initial state of links as they are created
    linkElements
      .enter()
      .insert('line', '.node')
      .classed('edge', true)
      .style('stroke', e => e.color)
      .style('stroke-width', e => e.width)
      .style('stroke-linecap', 'round')
      // Edge selection disabled.
      // .on("click",   (d) => {
      //   if (DBG) console.log('clicked on',d.label,d.id)
      //   this.edgeClickFn( d )
      // })
      .style('opacity', e => e.opacity);

    // .merge() updates the visuals whenever the data is updated.
    linkElements
      .merge(linkElements)
      // .classed("selected", e => e.selected) // is this used?
      .style('stroke', e => e.color)
      .style('stroke-width', e => e.width)
      .style('stroke-linecap', 'round')
      .transition()
      .duration(500)
      .style('opacity', e => e.opacity);

    linkElements.exit().remove();

    // UPDATE ANIMATED SIMULATION
    // this is a plugin
    this.simulation.nodes(this.data.nodes);
    if (this.data.edges) {
      this.simulation.force('link').links(this.data.edges);
    }

    // SELECTION ARROW
    this.d3svg.selectAll('#selectorArrow').remove();
    this.d3svg.selectAll('#secondarySelectorArrow').remove();

    // SINGLE ARROW APPROACH
    // nodeElements
    //   .merge(nodeElements)
    //   .filter(d => d.selected)
    //   .append('g')
    //   .attr('id', 'selectorArrow')
    //   .attr('transform', d => `translate(${- d.size - 5},0)`)
    //   .append('polygon')
    //   .attr('points', '0,0 -10,5 -10,-5 ')
    //   .attr('fill', 'red')
    //   .append('animateTransform')
    //   .attr('attributeName', 'transform')
    //   .attr('attributeType', 'XML')
    //   .attr('type', 'rotate')
    //   .attr('from', d => `0 ${d.size + 5} 0`)
    //   .attr('to', d => `360 ${d.size + 5} 0`)
    //   .attr('dur', '2s')
    //   .attr('repeatCount', 'indefinite')

    // MULTIPLE ARROW APPROACH
    this.selectorArrows = nodeElements
      .merge(nodeElements)
      .filter(d => d.selected)
      .append('g')
      .attr('id', 'selectorArrow')
      .attr('transform', d => `translate(${-d.size - 5},0)`);
    this.selectorArrows
      .append('polygon')
      .attr('points', '0,0 -10,5 -10,-5 ')
      .attr('fill', d => d.strokeColor)
      .append('animateTransform')
      .attr('attributeName', 'transform')
      .attr('attributeType', 'XML')
      .attr('type', 'rotate')
      .attr('from', d => `0 ${d.size + 5} 0`)
      .attr('to', d => `360 ${d.size + 5} 0`)
      .attr('dur', '6s')
      .attr('repeatCount', 'indefinite');
    this.selectorArrows
      .append('polygon')
      .attr('transform', d => `translate(${d.size + 5},0)`)
      .attr('points', '0,0 -10,5 -10,-5 ')
      .attr('fill', d => d.strokeColor)
      .append('animateTransform')
      .attr('attributeName', 'transform')
      .attr('attributeType', 'XML')
      .attr('type', 'rotate')
      .attr('from', d => `120 ${d.size + 5} 0`) // different rotation start
      .attr('to', d => `480 ${d.size + 5} 0`) // different rotation end
      .attr('dur', '6s')
      .attr('repeatCount', 'indefinite');
    this.selectorArrows
      .append('polygon')
      .attr('transform', d => `translate(${d.size + 5},0)`)
      .attr('points', '0,0 -10,5 -10,-5 ')
      .attr('fill', d => d.strokeColor)
      .append('animateTransform')
      .attr('attributeName', 'transform')
      .attr('attributeType', 'XML')
      .attr('type', 'rotate')
      .attr('from', d => `240 ${d.size + 5} 0`) // different rotation start
      .attr('to', d => `600 ${d.size + 5} 0`) // different rotation end
      .attr('dur', '6s')
      .attr('repeatCount', 'indefinite');

    // SECONDARY SELECTOR ARROW
    nodeElements
      .merge(nodeElements)
      .filter(d => d.selectedSecondary)
      .append('g')
      .attr('id', 'secondarySelectorArrow')
      .attr('transform', d => `translate(${-d.size - 5},0)`)
      .append('polygon')
      .attr('points', '0,0 -10,5 -10,-5 ')
      .attr('fill', 'blue')
      // .attr('fill', d => d.strokeColor)
      .append('animateTransform')
      .attr('attributeName', 'transform')
      .attr('attributeType', 'XML')
      .attr('type', 'rotate')
      .attr('from', d => `0 ${d.size + 5} 0`)
      .attr('to', d => `360 ${d.size + 5} 0`)
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Apply new force properties
      Call this on construct and if forceProperties have changed.
   */
  m_UpdateForces() {
    this.simulation
      .force(
        'link',
        d3
          .forceLink()
          .id(d => d.id) // note `d` is an edge, not a node
          // all edges use the same link distance, charge is what pushes them apart
          .distance(M_FORCEPROPERTIES.link.distance)
          .iterations(M_FORCEPROPERTIES.link.iterations)
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          // the larger the node, the harder it pushes
          .strength(
            d =>
              d.size *
              M_FORCEPROPERTIES.charge.strength *
              M_FORCEPROPERTIES.charge.enabled
          )
          .distanceMin(M_FORCEPROPERTIES.charge.distanceMin)
          .distanceMax(M_FORCEPROPERTIES.charge.distanceMax)
      )
      .force(
        'collide',
        d3
          .forceCollide()
          .strength(
            M_FORCEPROPERTIES.collide.strength * M_FORCEPROPERTIES.collide.enabled
          )
          // node radius (defaultSize+degrees) + preset radius keeps nodes separated
          // from each other like bouncing balls
          .radius(d => d.size + M_FORCEPROPERTIES.collide.radius)
          .iterations(M_FORCEPROPERTIES.collide.iterations)
      )
      .force(
        'center',
        d3
          .forceCenter()
          .x(m_width * M_FORCEPROPERTIES.center.x)
          .y(m_height * M_FORCEPROPERTIES.center.y)
      )
      .force(
        'forceX',
        d3
          .forceX()
          .strength(
            M_FORCEPROPERTIES.forceX.strength * M_FORCEPROPERTIES.forceX.enabled
          )
          .x(m_width * M_FORCEPROPERTIES.forceX.x)
      )
      .force(
        'forceY',
        d3
          .forceY()
          .strength(
            M_FORCEPROPERTIES.forceY.strength * M_FORCEPROPERTIES.forceY.enabled
          )
          .y(m_height * M_FORCEPROPERTIES.forceY.y)
      );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Update the display positions after each simulation tick

    This tick method is called repeatedly until the layout stabilizes.

    NOTE: the order in which we update nodes and links does NOT determine which
    gets drawn first -- the drawing order is determined by the ordering in the
    DOM.  See the notes under link_update.enter() above for one technique for
    setting the ordering in the DOM.
   */
  m_Tick() {
    // Drawing the nodes: Update the location of each node group element
    // from the x, y fields of the corresponding node object.
    this.zoomWrapper.selectAll('.node').attr('transform', d => {
      return 'translate(' + d.x + ',' + d.y + ')';
    });

    // Drawing the links: Update the start and end points of each line element
    // from the x, y fields of the corresponding source and target node objects.
    this.zoomWrapper
      .selectAll('.edge')
      .attr('x1', d => {
        return d.source.x;
      })
      .attr('y1', d => {
        return d.source.y;
      })
      .attr('x2', d => {
        return d.target.x;
      })
      .attr('y2', d => {
        return d.target.y;
      });
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  ZoomReset(data) {
    if (DBG) console.log(PR, 'ZOOM_RESET got state NCDATA', data);
    // NOTE: The transition/duration call means _HandleZoom will be called multiple times
    this.d3svg.transition().duration(200).call(this.zoom.scaleTo, 1);
  }

  ZoomIn(data) {
    if (DBG) console.log(PR, 'ZOOM_IN got state NCDATA', data);
    this.m_Transition(1.2);
  }

  ZoomOut(data) {
    if (DBG) console.log(PR, 'ZOOM_OUT got state NCDATA', data);
    this.m_Transition(0.8);
  }

  // Pan to 0,0 and zoom scale to 1
  // (Currently not used)
  ZoomPanReset(data) {
    if (DBG) console.log(PR, 'ZOOM_PAN_RESET got state NCDATA', data);
    const transform = d3.zoomIdentity.translate(0, 0).scale(1);
    this.d3svg.call(this.zoom.transform, transform);
  }

  /** This primarily handles mousewheel zooms
   */
  m_HandleZoom() {
    if (DBG) console.log(PR, 'HandleZoom');
    d3.select('.zoomer').attr('transform', d3.event.transform);
  }
  /** This handles zoom button zooms.
   */
  m_Transition(zoomLevel) {
    if (DBG) console.log(PR, 'Transition');
    this.d3svg
      .transition()
      //.delay(100)
      .duration(200)
      .call(this.zoom.scaleBy, zoomLevel);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   */
  m_Dragstarted(d, self) {
    if (DBG) console.log(PR, 'Dragstarted', d.x, d.y);
    // if (!d3.event.active) self.simulation.alphaTarget(0.3).restart(); // orig value results in a lot of movement after selection
    if (!d3.event.active) self.simulation.alphaTarget(0.01).restart(); // minimize shift after selection
    d.fx = d.x;
    d.fy = d.y;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   */
  m_Dragged(d) {
    if (DBG) console.log(PR, 'Dragged');
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   */
  m_Dragended(d, self) {
    if (DBG) console.log(PR, 'Dragended');
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
} // class NCGraphRenderer

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCGraphRenderer;
/* Exports should be

Deregister,
ClearSVG,
SetData,
UpdateGraph,
ZoomReset
ZoomIn
ZoomOut
ZoomPanReset

*/
