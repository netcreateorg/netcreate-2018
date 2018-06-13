/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    Auto Complete Demo
    ==================

    The basic structure of the app looks like this:

        AutoCompleteDemo
        |
        +- NodeSelector
        |  |
        |  +- NodeDetail
        |  |
        |  +- AutoComplete
        |     |
        |     +- AutoSuggest
        |
        +- EdgeEntry
        |  |
        |  +- *AutoComplete (for Target Node)*
        |
        +- NetGraph
           |
           +- D3SimpleNetGraph
              |
              +- D3



    # AutoCompleteDemo.jsx

    `AutoCompleteDemo.jsx` is the root element.

    *   All state is maintained in autocomplete-logic.jsx.
    *   It handles events from NodeSelector, EdgeEntry, and NetGraph components
        and passes data and upates across them.


    *PROPS*

    (none)


    *STATE*

    data                    A js Object containing `nodes` and `edges` arrays.
                            This data is rendered to the net graph directly by D3.

    selectedSourceNode      The currently selected node in NodeSelector.
                            This is used by EdgeEntry.jsx as the `source` node.

    selectedTargetNode      The currently selected target node in EdgeEntry.


    *EVENTS*

    Source/Target Input Updates
                            As the user types in either the source (NodeSelector)
                            or target (EdgeEntry) input fields, the current value
                            of the input field is passed to AutoCompleteDemo via
                            handlers: `this.handleSourceInputUpdate` and
                            `this.handleTargetInputUpdate`.

                            AutoCompleteDemo will use this value to set
                            `this.state.selectedSourceNode` and
                            `this.state.selectedTargetNode` which in turn will
                            update the respective AutoComplete input field in
                            NodeSelector and EdgeEntry.  This insures that the
                            AutoComplete field in both of those components are
                            fully 'controlled' fields (e.g. set automatically
                            via a local state setting).

    Source/Target Highlight
                            As the user highlights suggestions in either the
                            source (NodeSelector) or target (EdgeEntry) input
                            fields, the current highlighted item is passed to
                            AutoCompleteDemo via handlers:
                            `this.handleSourceHighlight` and
                            `this.handleTargetHighlight`.

                            AutoCompleteDemo uses this info to highlight
                            (mark by making it bold/outlined) particular nodes
                            and edges in the D3 graph.

    Source/Target Selection
                            When the user selects a particular node or edge in
                            NodeSelector or EdgeEntry input fields, the selected
                            item is passed to AutoCompleteDemo via handlers:
                            `this.handleSourceNodeSelection` and
                            `this.handleTargetNodeSelection`.

                            AutoCompleteDemo will update
                            `this.state.selectedSourceNode` and
                            `this.state.selectedTargetNode` based on this
                            selection.  This data is then passed on to
                            NodeSelector and EdgeEntry via props.

    Node Updates            When the user changes node data, either by adding a
                            new node or editing an existing node in
                            NodeSelector, the updated data is passed to
                            AutoCompleteDemo via `this.handleNodeUpdate` handler.

                            AutoCompleteDemo will update the graph data store
                            with the new node (replace existing node, or add
                            a new node)

    Edge Updates            When the user changes node data, either by adding a
                            new edge or editing an existing edge in EdgeEntry,
                            the updated data is passed to AutoCompleteDemo via
                            `this.handleEdgeUpdate` handler.

                            AutoCompleteDemo will update the graph data store
                            with the new edge (replace existing edge, or add
                            a new edge)

    *EVENTS: D3 Graph Updates*

    Mark Node/Edge          When a node or edge is higlighted via an AutoComplete
                            highlight or is selected via AutoComplete selection
                            or clicked on in NetGraph, it is shown bold (or
                            outlined) in the D3 graph.  This is done by updating
                            the node or edge in `this.state.data` object, setting
                            the object's `selected` key to a particular color
                            corresponding to the node/edge UI control.  When
                            the data is updated, it is passed to `NetGraph.jsx`,
                            which in turn updates the data in
                            `D3SimpleNetGraph.js`.  `D3SimpleNetGraph` will add
                            the highlight during its update cycle.

                            The colors allow us to highlight different fields
                            simultaneously with each component.  For example,
                            you can highlight both the source and target nodes
                            with different colors so you know which is which.
                            This is especially useful when the highlight matches
                            many objects, e.g. "Ah" matches 7 different nodes.

    Add New Node/Edge       When the user adds a new edge or node, handlers in
                            AutoCompleteDemo will update its `this.state.data`
                            with the new nodes/edges.  This is passed on to
                            `NetGraph.jsx` and in turn to `D3SimpleNetGraph.js`
                            which will display the new data during its update
                            cycle.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;


/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const d3           = require('d3');
const AutoComplete = require('./components/AutoComplete');
const NetGraph     = require('./components/NetGraph');
const NodeSelector = require('./components/NodeSelector');
const EdgeEntry    = require('./components/EdgeEntry');
const ACD_LOGIC    = require('./autocomplete-logic');
const ReactStrap   = require('reactstrap')
const { FormText } = ReactStrap

/// NEW SIGNLING SYSTEM LIBRARIES /////////////////////////////////////////////
const UNISYS       = require('system/unisys');
var   UDATA        = null; // set in constructor
      // start UNISYS
      UNISYS.SystemInitialize( module.id );

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// TODO: Remove thsese contants -- they're now defined in acl
const DESELECTED_COLOR = ''
const SOURCE_COLOR     = '#0000DD'
const TARGET_COLOR     = '#FF0000'

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// REVIEW: These are duplicated in AutoComplete. Pull out as utilites?
/// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
/// [DS] the context of this function isn't clear why we're using it; I'm guessing as I read through
/// [DS] what's the best way of building these kind of shared functions such that people actually
/// know when to use them? It's not clear to me not having reviewed the entirety of the code
/// and it's only used once. Also this style of function declaration is foreign to our codestyle
/// which favors oldschool function declarations, not this new arrow function stuff.

// TODO: This is moved to AutoComplete-Logic.  Can delete here.
// const escapeRegexCharacters = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') /*STYLE*/// function declaration hard to parse
// const appearsIn = (searchValue, targetString) => {
//   if (typeof searchValue !== 'string') { return false }
//   const escapedLabel = escapeRegexCharacters(searchValue.trim()) /*STYLE*/// why break this out? premature optimization
//   if (escapedLabel === '') { return false }
//   const regex = new RegExp(escapedLabel, 'i') // case insensitive
//   return regex.test(targetString)
// };

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class AutoCompleteDemo extends React.Component {
  constructor () {
    super()
    this.state = {
      data:                    {},    // nodes and edges data object
      selectedSourceNode:      {},
      selectedTargetNode:      {},
    }

    /*NEWCODE*/
    console.group(module.id);
    UDATA = UNISYS.NewDataLink( this );
    UDATA.Call('ACD_CONSTRUCT');
    console.groupEnd();
    /*NEWCODE END*/

    this.handleEdgeClick           = this.handleEdgeClick.bind(this)
    this.handleTargetInputUpdate   = this.handleTargetInputUpdate.bind(this)
    this.handleTargetHighlight     = this.handleTargetHighlight.bind(this)
    this.handleTargetNodeSelection = this.handleTargetNodeSelection.bind(this)
    this.handleEdgeUpdate          = this.handleEdgeUpdate.bind(this)
    this.findMatchingEdgeWithSource = this.findMatchingEdgeWithSource.bind(this)
    this.findMatchingEdgeWithTarget = this.findMatchingEdgeWithTarget.bind(this)
    this.findMatchingEdge          = this.findMatchingEdge.bind(this)
    this.setSelectedEdge           = this.setSelectedEdge.bind(this)
    this.markSelectedEdgeById      = this.markSelectedEdgeById.bind(this)
  }


  handleEdgeClick ( clickedEdge ) {
    /*NEWCODE*/
    UDATA.Call('EDGE_SELECT',{ clickedEdge });
    /*NEWCODE END*/

    if (DBG) console.log('AutoCompleteDemo.handleEdgeClick',clickedEdge)
    this.setState( {
      selectedSourceNode: clickedEdge.source,
      selectedTargetNode: clickedEdge.target,
    })
    this.setSelectedEdge(clickedEdge) /*STYLE*/// this doesn't update the visual?

    // Update markers
    /*STYLE*/// these handle the actual visual update?
    this.markSelectedEdgeById( clickedEdge.id )
    this.deselectAllNodes()
    this.markSelectedNodeById( clickedEdge.source.id, SOURCE_COLOR)
    this.markSelectedNodeById( clickedEdge.target.id, TARGET_COLOR)
  }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// SOURCE AND TARGET INPUT HANDLERS
  ///
  /*STYLE*/// in general should document who calls this in comments

  handleTargetInputUpdate ( label ) {
    /*NEWCODE*/
    // when target label changes due to SELECTION, find and "mark" matching node
    // and save it as selected target
    UDATA.Call('FILTER_SOURCES',{ label });
    /*NEWCODE END*/

    if (DBG) console.log('AutoCompleteDemo.handleTargetInputUpdate',label)
    // mark matching nodes
    this.markSelectedNodes( label, TARGET_COLOR )
    // if it doesn't match a node exactly, we clear the selected node
    // but pass the input value
    this.setState( {
      selectedTargetNode: {label: label}
    })

    this.findMatchingEdgeWithTarget(label)
  }
  handleTargetHighlight ( label ) {
    /*NEWCODE*/
    // when target label changes, find and "mark" matching nodes
    // there is a different color for "hilite" versus "source"
    UDATA.Call('TARGET_HILITE',{ label });
    /*NEWCODE END*/

    if (DBG) console.log('AutoCompleteDemo.handleTargetHighlight',label)
    // mark matching nodes
    if (label!==null) this.markSelectedNodes( label, TARGET_COLOR )
  }
  handleTargetNodeSelection ( node ) {
    if (DBG) console.log('AutoCompleteDemo.handleTargetNodeSelection',node)
    if (node.id===undefined) {
      // Invalid node, NodeSelect is trying to clear the selection
      // we have to do this here, otherwise, the label will persist
      console.log('...clearing selectedTargetNode')
      this.setState( { selectedTargetNode:{} } )
    } else {
      // Valid node, so select it
      this.setState( { selectedTargetNode: node } )
      this.markSelectedNodeById( node.id, TARGET_COLOR )
    }

    this.findMatchingEdgeWithTarget(node.label)
  }


  /// Update existing edge, or add a new edge
  handleEdgeUpdate ( newEdgeData ) { /*STYLE*/// this is called 'newEdgeData' but it isn't always new

    /*NEWCODE*/
    UDATA.Call('EDGE_UPDATE',{ newNodeData });
    /*NEWCODE END*/

    if (DBG) console.log('AutoCompleteDemo.handleEdgeUpdate',newEdgeData)
    let updatedData = this.state.data
    let found = false
    // Update existing?
    updatedData.edges = this.state.data.edges.map( edge => {
      if (edge.id === newEdgeData.id) {
        edge.id                         = newEdgeData.id
        edge.source                     = this.findNodeById( newEdgeData.sourceId )
        edge.target                     = this.findNodeById( newEdgeData.targetId )
        edge.attributes["Relationship"] = newEdgeData.type
        edge.attributes["Citations"]    = newEdgeData.info
        edge.attributes["Notes"]        = newEdgeData.notes
        console.log('...updated existing edge',edge.id)
        found = true
      }
      return edge
    })
    // Nope, add a new one instead
    if (!found) {
      // Add a new edge
      console.log('...adding new edge',newEdgeData.id)
      let edge = {attributes:{}}
      edge.id                         = newEdgeData.id
      edge.source                     = this.findNodeById( newEdgeData.sourceId )
      edge.target                     = this.findNodeById( newEdgeData.targetId )
      edge.attributes["Relationship"] = newEdgeData.type
      edge.attributes["Citations"]    = newEdgeData.info
      edge.attributes["Notes"]        = newEdgeData.notes
      edge.size                       = 1                       // REQUIRED!
      updatedData.edges.push(edge)
    }
    this.setState({ data: updatedData })
    // Clear Target Node
    this.setState({ selectedTargetNode: {} })
  }



  findMatchingEdgeWithSource ( sourceLabel ) {
    let targetLabel = this.state.selectedTargetNode ? this.state.selectedTargetNode.label : ''
    return this.findMatchingEdge( sourceLabel, targetLabel )
  }
  findMatchingEdgeWithTarget ( targetLabel ) {
    let sourceLabel = this.state.selectedSourceNode ? this.state.selectedSourceNode.label : ''
    return this.findMatchingEdge( sourceLabel, targetLabel )
  }
  /// When a source or target node is selected, check to see
  /// if the pair matches an edge.
  /// If there's a match, set this.state.selectedEdge
  findMatchingEdge (sourceLabel, targetLabel) {
    if (DBG) console.log('AutoCompleteDemo.findMatchingEdge Looking for match...')
    if (sourceLabel!==undefined && targetLabel!==undefined) {
      let found = this.state.data.edges.filter( edge => edge.source.label===sourceLabel && edge.target.label===targetLabel )
      if (found.length>0) {
        let matchingEdge = found[0]
        if (DBG) console.log('AutoCompleteDemo.findMatchingEdge FOUND!',matchingEdge)
        this.setSelectedEdge( matchingEdge )
        return
      }
    }
    if (DBG) console.log('...no match found, clearing selectedEdge')
    // Not Found, clear selectedEdge
    this.setSelectedEdge({})
  }

  /// Call this to set selectedEdge state
  setSelectedEdge ( edge ) {
    this.setState({ selectedEdge: edge })
    this.markSelectedEdgeById( edge.id )
  }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// MANAGE GRAPH DATA
  ///

  /// Only select nodes that have not already been selected
  getSelectedNodeColor ( node, color ) {
    if (node.selected===undefined || node.selected===DESELECTED_COLOR) {
      return color
    } else {
      return node.selected    // default to existing color
    }
  }
  /// Only deselect nodes that were selected by this instance, ignore selections
  /// from other NodeSelectors
  /*STYLE*/// this is called from deselectAllNodes without specifying 'color'. what is intent?
  /*STYLE*/// what is an 'NodeSelector instance'? a set of matching nodes? premature optimization?
  getDeselectedNodeColor ( node, color ) {
    if (node.selected!==color ) { // this.props.selectedColor) {
      return node.selected /*STYLE*/// node.selected is a color AND a truthy value???
    } else {
      return DESELECTED_COLOR
    }
  }
  ///
  /// EDGES
  ///
  markSelectedEdgeById( id ) {
// REMOVE because marking is now handled by acl?
    // let updatedData = this.state.data
    // updatedData.edges = this.state.data.edges.map( edge => {
    //   edge.selected = (edge.id===id)  /*STYLE*/// edge.selected doesn't mirror node.selected in value type (node.selected is a color)
    //   return edge
    // })
    // this.setState( { data: updatedData })
  }




  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// REACT LIFECYCLE
  ///
  componentDidMount () {
    // kickoff initialization stage by stage
    (async () => {
      await UNISYS.EnterApp();
      await UNISYS.SetupRun();
    })();
  }

  render() {
    /*STYLE*/// might be possible to replace props like "onHighlight= blah blah" with
            /// handleSourceHighlight = { this }  // destructuring assignment
            /// which is equivalent to handleSourceHighlight = this.handleSourceHighlight
            /// so we don't introduce another set of function names

    return (
      <div>
        <h1>Auto Complete Demo</h1>
        <p>This demonstrates how a d3 force simulation, a node selection input
        field, and a node viewer might be encapsulated into react components
        and pass data back and forth to each other.</p>
        <p>INSTRUCTIONS: Type in the "Nodes" input field to highlight nodes or
        a node around to see how it's linked to other nodes.</p>
        <div style={{display:'flex', flexFlow:'row nowrap',
             width:'100%', height:'100%'}}>
          <div id="left" style={{backgroundColor:'#E0ffff',flex:'1 0 auto',maxWidth:'300px',padding:'10px'}}>
            <div style={{display:'flex', flexFlow:'column nowrap',height:100+'%'}}>
              <div style={{flexGrow:1}}>
                <h3>Nodes (RF)</h3>
              </div>
              <div>
                <NodeSelector/>
              </div>
            </div>
          </div>
          <div id="middle" style={{backgroundColor:'#fcfcfc', flex:'3 0 auto', padding:'10px'}}>
            <NetGraph/>
          </div>
          <div id="right" style={{backgroundColor:'#ffffE0', flex:'1 0 auto', padding:'10px'}}>
            <h3>Edges</h3>
          </div>
        </div>
      </div>
    )
  }
}



/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoCompleteDemo
