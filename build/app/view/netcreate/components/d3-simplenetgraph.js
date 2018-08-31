/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    D3 Simple NetGraph

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

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG        = false;

/* eslint-disable prefer-reflect */
/* d3.call() is false-triggering the above rule */

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const d3       = require('d3')
const UNISYS   = require('unisys/client');
var   UDATA    = null;


/// PRIVATE VARS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_width   = 1024;
let m_height  = 1024;
let m_forceProperties = {   // values for all forces
      center: {
        x: 0.5,
        y: 0.5
      },
      charge: {
        enabled: true,
        strength: -1500,  //-1000, // -20,
        distanceMin: 20,  //50, // 1,
        distanceMax: 1000 //2000
      },
      collide: {
        enabled: true,
        strength: 0.7,
        iterations: 1,
        radius: 4
      },
      forceX: {
        enabled: true,
        strength: 0.2,    // 0.03,
        x: 0.5
      },
      forceY: {
        enabled: true,
        strength: 0.2,    // 0.03,
        y: 0.5
      },
      link: {
        enabled: true,
        distance: 60, // 30,
        iterations: 2 // 1
      }
    }; // m_forceProperties



/// D3NetGraph CLASS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class D3NetGraph {

    constructor ( rootElement ) {

      this.rootElement  = rootElement;
      this.d3svg        = {};
      this.zoomWrapper  = {};
      this.simulation   = {};
      this.data         = {};

      this.clickFn      = {};

      this.defaultSize  = 5;
      this.defaultColor = '#DEF';

      /// Initialize UNISYS DATA LINK for REACT
      UDATA = UNISYS.NewDataLink(this);

  /// D3 CODE ///////////////////////////////////////////////////////////////////
  /// note: this is all inside the class constructor function!
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Create svg element which will contain our D3 DOM elements.
      Add default click handler so when clicking empty space, deselect all.
      NOTE: the svg element is actualy d3.selection object, not an svg obj.
  /*/ this.d3svg = d3.select(rootElement).append('svg')
        .attr('width', "100%")            // overrride m_width so SVG is wide
        .attr('height',m_height)
        .on("click", ( e, event ) => {
            // Deselect
            UDATA.Call('SOURCE_SELECT',{ nodeLabels: [] });
            }
        )
        .call(d3.zoom().on("zoom", function () {
          d3.select('.zoomer').attr("transform", d3.event.transform);
        }));
      this.zoomWrapper = this.d3svg.append('g').attr("class","zoomer");
      this.simulation = d3.forceSimulation();
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// END D3 CODE ///////////////////////////////////////////////////////////////

      // bind 'this' to function objects so event handlers can access
      // contents of this class+module instance
      this._Initialize        = this._Initialize.bind(this);
      this._UpdateGraph       = this._UpdateGraph.bind(this);
      this._UpdateForces      = this._UpdateForces.bind(this);
      this._Tick              = this._Tick.bind(this);
      this._Dragstarted       = this._Dragstarted.bind(this);
      this._Dragged           = this._Dragged.bind(this);
      this._Dragended         = this._Dragended.bind(this);

      // watch for updates to the D3DATA data object
      UDATA.OnAppStateChange('D3DATA',(data)=>{
        // expect { nodes, edges } for this namespace
        if (DBG) console.log('D3SimpleNetgraph got state D3DATA',data);
        this.SetData(data);
      });

  }


/// CLASS PUBLIC METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The parent container passes data to the d3 graph via this SetData call
    which then triggers all the internal updates
/*/ SetData ( newData ) {
      this.data = newData
      if (newData && newData.nodes) {
        this._Initialize()
        this._UpdateForces()
        this._UpdateGraph()
        // updates ignored until this is run restarts the simulation
        // (important if simulation has already slowed down)
        this.simulation.alpha(1).restart()
      }
    }


/// CLASS PRIVATE METHODS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This sets up the force properties for the simulation and tick handler.
/*/ _Initialize () {
      // Create the force layout.  After a call to force.start(), the tick
      // method will be called repeatedly until the layout "gels" in a stable
      // configuration.
      this.simulation
        .force("link",    d3.forceLink())
        .force("charge",  d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center",  d3.forceCenter())
        .force("forceX",  d3.forceX())
        .force("forceY",  d3.forceY())

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

/*/ _UpdateGraph () {

      // DATA JOIN
      // select all elemnts with class .node in d3svg
      // bind selected elements with elements in this.data.nodes,
      // assigning each one an id using the key function.

      // nodeElements is a d3.selection object
      let nodeElements = this.zoomWrapper.selectAll(".node")
        .data(this.data.nodes, (d) => { return d.id }); // fn returns the calculated key for the data object

      // edges is a d3.selection object
      let linkElements = this.zoomWrapper.selectAll(".edge")
        .data(this.data.edges, (d) => { return d.id }); // fn returns the calculated key for the data object

      // TELL D3 HOW TO HANDLE NEW NODE DATA
      // the d3.selection.enter() method sets the operational scope for
      // subsequent calls
      let elementG = nodeElements.enter()
        .append("g")
          .classed('node',true);

      // enter node: append 'g' (group) element and click behavior
      elementG
        .call(d3.drag()
          .on("start", (d) => { this._Dragstarted(d, this) })
          .on("drag",  this._Dragged)
          .on("end",   (d) => { this._Dragended(d, this) }))
        .on("click",   (d) => {
            if (DBG) console.log('clicked on',d.label,d.id)
            UDATA.Call('SOURCE_SELECT',{ nodeIDs: [d.id] });
            d3.event.stopPropagation();
          });

      // enter node: also append 'circle' element of a calculated size
      elementG
        .append("circle")
          // "r" has to be set here or circles don't draw.
          .attr("r", (d) => {
              let radius = this.data.edges.reduce((acc,ed)=>{
                return (ed.source===d.id || ed.target===d.id) ? acc+1 : acc;
              },1);
              d.weight = radius
              d.size   = radius // save the calculated size
              return this.defaultSize + (this.defaultSize * d.weight / 2)
          })
  //        .attr("r", (d) => { return this.defaultSize }) // d.size ?  d.size/10 : this.defaultSize; })
          .attr("fill", (d) => { return d.color ? d.color : this.defaultColor; });

      // enter node: also append 'text' element
      elementG
        .append("text")
          .classed('noselect', true)
          .attr("font-size", 10)
          .attr("dx", (d=>{return this.defaultSize + 5})) // 8)
          .attr("dy", "0.35em") // ".15em")
          .text((d) => { return d.label });

      // enter node: also append a 'title' tag
      elementG
        .append("title") // node tooltip
          .text((d) => { return d.label; });

      /*/ TRICKY D3 CODE CONCEPTS AHEAD

          CONTEXT: The author of this code has assumed that D3DATA may
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
          .attr("stroke",       (d) => {
            if (d.selected)    return d.selected;
            if (d.strokeColor) return d.strokeColor;
            return undefined; // don't set stroke color
          })
          .attr("stroke-width", (d) => {
            if (d.selected || d.strokeColor) return '5px';
            return undefined // don't set stroke width
          })
// this "r" is necessary to resize aftger a link is added
          .attr("r", (d) => {
              let radius = this.data.edges.reduce((acc,ed)=>{
                return (ed.source.id===d.id || ed.target.id===d.id) ? acc+1 : acc
              },1);
              d.weight = radius
              d.size = radius // save the calculated size
              return this.defaultSize + (this.defaultSize * d.weight / 2)
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
          .text((d) => { return d.label });  // in case text is updated

      // TELL D3 what to do when a data node goes away
      nodeElements.exit().remove()

      // NOW TELL D3 HOW TO HANDLE NEW EDGE DATA
      // .insert will add an svg `line` before the objects classed `.node`
      linkElements.enter()
        .insert("line",".node")
          .classed('edge', true)
        .on("click",   (d) => {
          if (DBG) console.log('clicked on',d.label,d.id)
          this.edgeClickFn( d )
        })

      linkElements.merge(linkElements)
        .classed("selected",  (d) => { return d.selected })

      linkElements.exit().remove()

      // UPDATE ANIMATED SIMULATION
      // this is a plugin
      this.simulation.nodes(this.data.nodes)
      this.simulation.force("link").links(this.data.edges)

    }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Apply new force properties
    Call this on construct and if forceProperties have changed.
/*/ _UpdateForces ( data ) {
      this.simulation
        .force("link", d3.forceLink()
            .id((d) => {return d.id})
            .distance( (d)=>{return m_forceProperties.link.distance} )
// this doesn't seem to change anything?!?  The m_forceProperties.link.distance is the only value that seems to matter?
//            .distance( (d)=>{return m_forceProperties.link.distance+d.size*10 } )
//            .distance( (d)=>{return m_forceProperties.link.distance * (1/d.size) } )
//            .distance( m_forceProperties.link.distance )
            .iterations(m_forceProperties.link.iterations))
        .force("charge", d3.forceManyBody()
//            .strength(m_forceProperties.charge.strength * m_forceProperties.charge.enabled)
//            .strength( (d)=>{return d.size/6 * m_forceProperties.charge.strength * m_forceProperties.charge.enabled} )
            .strength( (d)=>{return d.size/4 * m_forceProperties.charge.strength * m_forceProperties.charge.enabled} )
            .distanceMin(m_forceProperties.charge.distanceMin)
            .distanceMax(m_forceProperties.charge.distanceMax))
        .force("collide", d3.forceCollide()
            .strength(m_forceProperties.collide.strength * m_forceProperties.collide.enabled)
            .radius((d) => {return d.size/m_forceProperties.collide.radius;})
            .iterations(m_forceProperties.collide.iterations))
        .force("center", d3.forceCenter()
            .x(m_width * m_forceProperties.center.x)
            .y(m_height * m_forceProperties.center.y))
        .force("forceX", d3.forceX()
            .strength(m_forceProperties.forceX.strength * m_forceProperties.forceX.enabled)
            .x(m_width * m_forceProperties.forceX.x))
        .force("forceY", d3.forceY()
            .strength(m_forceProperties.forceY.strength * m_forceProperties.forceY.enabled)
            .y(m_height * m_forceProperties.forceY.y))
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
        .attr("transform", (d) => { return "translate("+d.x+","+d.y+")" })

      // Drawing the links: Update the start and end points of each line element
      // from the x, y fields of the corresponding source and target node objects.
      this.zoomWrapper.selectAll(".edge")
        .attr("x1", (d) => { return d.source.x; })
        .attr("y1", (d) => { return d.source.y; })
        .attr("x2", (d) => { return d.target.x; })
        .attr("y2", (d) => { return d.target.y; })
    }



/// UI EVENT HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ _Dragstarted (d, self) {
      if (!d3.event.active) self.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ _Dragged (d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ _Dragended (d, self) {
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
module.exports = D3NetGraph