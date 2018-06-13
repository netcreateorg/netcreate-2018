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

    This is based on:
    *  rdpoor's commented version of mbostock's original code
       https://gist.github.com/rdpoor/3a66b3e082ffeaeb5e6e79961192f7d8
    *  danilo's v4 update
       https://bl.ocks.org/tezzutezzu/cd04b3f1efee4186ff42aae66c87d1a7
    *  mbostock's general update pattern
       https://bl.ocks.org/mbostock/3808218

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


var DBG = false;


/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const d3       = require('d3')
const UNISYS   = require('system/unisys');
var   UDATA    = null;


/// PRIVATE VARS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let _width   = 1024
let _height  = 1024
let _forceProperties = {   // values for all forces
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
        strength: .2, //.03,
        x: .5
      },
      forceY: {
        enabled: true,
        strength: .2, //.03,
        y: .5
      },
      link: {
        enabled: true,
        distance: 30,
        iterations: 1
      }
    }



/// D3NetGraph CLASS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class D3NetGraph {



  constructor ( rootElement ) {
    /// Instance Variables - - - - - - - - - - - - - - - - - - - - - - - - - -
    this.rootElement  = rootElement
    this.svg          = {}
    this.simulation   = {}
    this.data         = {}

    this.clickFn      = {}

    this.defaultSize  = 5
    this.defaultColor = '#000'

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// Simple Instance Variables - - - - - - - - - - - - - - - - - - - - - - - - - -

    /// Constructor - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    this.svg = d3.select(rootElement).append('svg')
      .attr('width', _width)
      .attr('height',_height)

    this.simulation = d3.forceSimulation()

    /// Bindings  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    this._Initialize        = this._Initialize.bind(this)
    this._UpdateGraph       = this._UpdateGraph.bind(this)
    this._UpdateForces      = this._UpdateForces.bind(this)
    this._Tick              = this._Tick.bind(this)
    this._Dragstarted       = this._Dragstarted.bind(this)
    this._Dragged           = this._Dragged.bind(this)
    this._Dragended         = this._Dragended.bind(this)

    /// Receive Data Updates - - - - - - - - - - - - - - - - - - - - - - - - -
    UDATA.OnStateChange('D3DATA',(data)=>{
      // expect { nodes, edges } for this namespace
      console.log('D3SimpleNetgraph got state D3DATA',data);
      this.SetData(data);
    });

  }


  /*SHINY UNISYS REPLACEMENT FOR RECEIVING DATA UPDATES*/


  /// CLASS PUBLIC METHODS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ///
  ///   The parent container passes data to the d3 graph via this SetData call
  ///   which then triggers all the internal updates
  ///
  SetData ( newData ) {
    this.data = newData
    if (newData && newData.nodes) {
      this._Initialize()
      this._UpdateForces()
      this._UpdateGraph()

      // updates ignored until this is run
      // restarts the simulation (important if simulation has already slowed down)
      this.simulation.alpha(1).restart()
    }
  }
  ///
  ///   When a node is clicked, clickFn will be called
  /// CALLED BY PARENT COMPONENT NetGraph.jsx, which is called from AutoCompleteDemo.jsx
  SetNodeClickHandler ( clickHandler ) {
    this.nodeClickFn = clickHandler
  }
  SetEdgeClickHandler ( clickHandler ) {
    this.edgeClickFn = clickHandler
  }




  /// CLASS PRIVATE METHODS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// _Initialize
  ///     This sets up the force properties for the simulation
  ///     And the tick handler.
  ///
  _Initialize () {
    // Create the force layout.  After a call to force.start(), the tick method will
    // be called repeatedly until the layout "gels" in a stable configuration.
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
  /// _UpdateGraph
  ///     Call this after data has been loaded
  ///     This creates link and node svg objects
  ///     and sets their forceProperties
  ///
  ///     The component `node` looks like this:
  ///         <g class="node">  // node group object
  ///            <circle>
  ///            <text>         // label
  ///            <title>        // tooltip
  ///         </g>
  ///
  _UpdateGraph () {

    // DATA JOIN
    // Join new data with old elements, if any.
    let nodeElements = this.svg.selectAll(".node")
      .data(this.data.nodes, (d) => { return d.id })
    let linkElements = this.svg.selectAll(".edge")
      .data(this.data.edges, (d) => { return d.source.id+"-"+d.target.id })


    // ENTER
    // Create new elements as needed.
    //
    // ENTER + UPDATE
    // After merging the entered elements with the update selection,
    // apply operations to both.
    let nodes = nodeElements.enter()
      .append("g")
        .classed('node',true)
      .call(d3.drag()
        .on("start", (d) => { this._Dragstarted(d, this) })
        .on("drag",  this._Dragged)
        .on("end",   (d) => { this._Dragended(d, this) }))
      .on("click",   (d) => {
          if (DBG) console.log('clicked on',d.label,d.id)
          // We pass nodeLabels here because it's the lowest common denominator --
          // not all components have acccess to complete node objects.
          UDATA.Call('SOURCE_SELECT',{ nodeLabels: [d.label] }); })

    nodes.append("circle")
        .attr("r",
          (d) => {
            let count = 1
            this.data.edges.map( (l)=>{ l.source == d.id || l.target == d.id ? count++ : 0 } )
            d.weight = count
            // console.log(d.weight)
            return this.defaultSize * d.weight
        })
//        .attr("r", (d) => { return this.defaultSize }) // d.size ?  d.size/10 : this.defaultSize; })
        .attr("fill", (d) => { return d.color ? d.color : this.defaultColor; })
    nodes
      .append("text")
        .classed('noselect', true)
        .attr("font-size", 10)
        .attr("dx", 8)
        .attr("dy", ".15em")
        .text((d) => { return d.label })
    nodes
      .append("title") // node tooltip
        .text((d) => { return d.label; })


    linkElements.enter()
      .insert("line",".node")
        .classed('edge', true)
      .on("click",   (d) => {
          console.log('clicked on',d.label,d.id)
          this.edgeClickFn( d ) })



    // UPDATE
    // Update old elements as needed.
    nodeElements.merge(nodeElements)
      .selectAll("circle")
        .attr("stroke",       (d) => { if (d.selected) return d.selected; })
        .attr("stroke-width", (d) => { if (d.selected) return '5px'; })
        .attr("r",
          (d) => {
            let count = 1
            this.data.edges.map( (l)=>{ l.source.id == d.id || l.target.id == d.id ? count++ : 0 } )
            d.weight = count
            // console.log(d.weight)
            return this.defaultSize * d.weight
        })
    nodeElements.merge(nodeElements)
      .selectAll("text")
        .attr("color",        (d) => { if (d.selected) return d.selected; })
        .attr("font-weight",  (d) => { if (d.selected) return 'bold'; })
        .text((d) => { return d.label })  // in case text is updated

    linkElements.merge(linkElements)
      .classed("selected",  (d) => { return d.selected })



    // EXIT
    // Remove old elements as needed.
    nodeElements.exit().remove()
    linkElements.exit().remove()


    // UPDATE
    this.simulation.nodes(this.data.nodes)
    this.simulation.force("link").links(this.data.edges)

  }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// _UpdateForces
  ///     Apply new force properties
  ///     Call this on construct and if forceProperties have changed.
  _UpdateForces ( data ) {
    this.simulation
      .force("link", d3.forceLink()
          .id((d) => {return d.id})
          .distance( (d)=>{return _forceProperties.link.distance * (1/d.size) } )
//          .distance(_forceProperties.link.distance)
          .iterations(_forceProperties.link.iterations))
      .force("charge", d3.forceManyBody()
//          .strength(_forceProperties.charge.strength * _forceProperties.charge.enabled)
          .strength( (d)=>{return d.size/6 * _forceProperties.charge.strength * _forceProperties.charge.enabled} )
          .distanceMin(_forceProperties.charge.distanceMin)
          .distanceMax(_forceProperties.charge.distanceMax))
      .force("collide", d3.forceCollide()
          .strength(_forceProperties.collide.strength * _forceProperties.collide.enabled)
          .radius((d) => {return d.size/_forceProperties.collide.radius;})
          .iterations(_forceProperties.collide.iterations))
      .force("center", d3.forceCenter()
          .x(_width * _forceProperties.center.x)
          .y(_height * _forceProperties.center.y))
      .force("forceX", d3.forceX()
          .strength(_forceProperties.forceX.strength * _forceProperties.forceX.enabled)
          .x(_width * _forceProperties.forceX.x))
      .force("forceY", d3.forceY()
          .strength(_forceProperties.forceY.strength * _forceProperties.forceY.enabled)
          .y(_height * _forceProperties.forceY.y))
  }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// _Ticked
  ///       Update the display positions after each simulation tick
  ///
  ///       This tick method is called repeatedly until the layout stabilizes.
  ///
  ///       NOTE: the order in which we update nodes and links does NOT determine which
  ///       gets drawn first -- the drawing order is determined by the ordering in the
  ///       DOM.  See the notes under link_update.enter() above for one technique for
  ///       setting the ordering in the DOM.
  ///
  _Tick() {
    // Drawing the nodes: Update the location of each node group element
    // from the x, y fields of the corresponding node object.
    this.svg.selectAll(".node")
      .attr("transform", (d) => { return "translate("+d.x+","+d.y+")" })

    // Drawing the links: Update the start and end points of each line element
    // from the x, y fields of the corresponding source and target node objects.
    this.svg.selectAll(".edge")
      .attr("x1", (d) => { return d.source.x; })
      .attr("y1", (d) => { return d.source.y; })
      .attr("x2", (d) => { return d.target.x; })
      .attr("y2", (d) => { return d.target.y; })
  }



  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  _Dragstarted (d, self) {
    if (!d3.event.active) self.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  _Dragged (d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  _Dragended (d, self) {
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
}




/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = D3NetGraph
