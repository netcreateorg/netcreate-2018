/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const d3           = require('d3');
const AutoComplete = require('./components/AutoComplete');
const NetGraph     = require('./components/NetGraph');
const NodeSelector = require('./components/NodeSelector');
const EdgeEntry    = require('./components/EdgeEntry');
const ReactStrap   = require('reactstrap')
const { FormText } = ReactStrap



/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DESELECTED_COLOR = ''



/// React Component ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


/// export a class object for consumption by brunch/require
class AutoCompleteDemo extends React.Component {
  constructor () {
    super()
    this.state = { 
      data:             {},    // nodes and edges data object
      nodeSearchString: ''     // node label search string set in AutoComplete input field
    }
    this.updateData               = this.updateData.bind(this)
    this.handleJSONLoad           = this.handleJSONLoad.bind(this)
    this.handleNodeSelection      = this.handleNodeSelection.bind(this)
    this.handleNodeClick          = this.handleNodeClick.bind(this)
  }



  updateData ( newData ) {
    this.setState( { 
      data:    newData
    })
  }

  handleJSONLoad ( error, _data ) {
    if (error) throw error
    // map nodes[].label to textList
    this.updateData( _data )
  }

  handleNodeSelection ( selectedNode ) {
    this.setState( {
      selectedSourceNode: selectedNode
    })
  }

  handleNodeClick ( clickedNode ) {
    console.log('AutoCompleteDemo.handleNodeClick',clickedNode)
    this.setState( {
      selectedSourceNode: clickedNode
    })
    this.deselectAllNodes()
    this.updateSelectedNodesById( clickedNode.id )
  }




  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// MANAGE GRAPH DATA
  ///
  /// Set the `selected` flag for any nodes that match `searchValue`, and update the state
  /// The parent component is notified and the data is passed via onDataUpdate
  updateSelectedNodes( searchValue ) {
    if (searchValue==='') {
      this.deselectAllNodes()
      return
    }
    let updatedData = this.state.data
    updatedData.nodes = this.state.data.nodes.map( node => {
      if (appearsIn(searchValue, node.label)) {
        node.selected = this.getSelectedNodeColor( node )
      } else {
        node.selected = this.getDeselectedNodeColor( node )
      }
      return node
    })
    this.setState( { data: updatedData })
    // Notify the parent
    this.props.onDataUpdate( updatedData )
  }
  updateSelectedNodesById( id ) {
    if (id==='') {
      this.deselectAllNodes()
      return
    }
    let updatedData = this.state.data
    updatedData.nodes = this.state.data.nodes.map( node => {
      if (node.id===id) {
        node.selected = this.getSelectedNodeColor( node )
      } else {
        node.selected = this.getDeselectedNodeColor( node )
      }
      return node
    })
    this.setState( { data: updatedData })
    // Notify the parent
    this.props.onDataUpdate( updatedData )
  }
  /// Only select nodes that have not already been selected
  getSelectedNodeColor ( node ) {
    if (node.selected===undefined || node.selected===DESELECTED_COLOR) {
      return "#00EE00" // this.props.selectedColor
    } else {
      return node.selected    // default to existing color
    }
  }
  /// Only deselect nodes that were selected by this instance, ignore selections
  /// from other NodeSelectors
  getDeselectedNodeColor ( node ) {
    if (node.selected!==this.props.selectedColor) {
      return node.selected 
    } else {
      return DESELECTED_COLOR
    }
  }
  deselectAllNodes () {
    for (let node of this.state.data.nodes) { node.selected = this.getDeselectedNodeColor( node ) }
  }




  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// REACT LIFECYCLE
  ///
  componentDidMount () {
    // Verify D3 Loaded: console.log('D3',d3)
    // Load Data
    // This loads data from the htmldemos/d3forcedemo data file for now.
    // Relative URLS don't seem to work.
    // The URL is constructed in http://localhost:3000/scripts/node_modules/url/url.js line 110.
    d3.json("http://localhost:3000/htmldemos/d3forcedemo/data.json", this.handleJSONLoad)
  }

  render() {
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
                <h3>Nodes</h3>
              </div>
              <div>
                <NodeSelector 
                  data={this.state.data}
                  onDataUpdate={this.updateData}
                  onNodeSelected={this.handleNodeSelection}
                  selectedColor="#0000FF"
                />
                <EdgeEntry 
                  data={this.state.data}
                  onDataUpdate={this.updateData}
                  selectedSourceNode={this.state.selectedSourceNode}
                  selectedTargetNode={this.state.selectedTargetNode}
                  selectedColor="#EE0000"
                />
              </div>
            </div>
          </div>
          <div id="middle" style={{backgroundColor:'#fcfcfc', flex:'3 0 auto', padding:'10px'}}>
            <NetGraph 
              data={this.state.data}
              onNodeClick={this.handleNodeClick}
            />
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
