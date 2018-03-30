/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const d3           = require('d3');
const AutoComplete = require('./components/AutoComplete');
const NetGraph     = require('./components/NetGraph');
const NodeDetail   = require('./components/NodeDetail');

/// React Component ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*
    lexicon is a one-dimensional string array that represents the complete list 
    of all possible suggestions that are then filtered based on the user typing
    for suggestions.
*/


/// export a class object for consumption by brunch/require
class AutoCompleteDemo extends React.Component {
  constructor () {
    super()
    this.state = { 
      data:             {},    // nodes and edges data object
      lexicon:          [],    // string array of node labels
      nodeSearchString: ''     // node label search string set in AutoComplete input field
    }
    this.handleJSONLoad = this.handleJSONLoad.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleNodeSelection = this.handleNodeSelection.bind(this)
    this.setStateDataSelectedNode = this.setStateDataSelectedNode.bind(this)
  }

  handleJSONLoad ( error, _data ) {
    if (error) throw error
    // map nodes[].label to textList
    this.setState( {
      data:    _data,
      lexicon: _data.nodes.map(function(d){return d.label})
    })
  }

  handleInputChange ( value ) {
    this.setState( {nodeSearchString: value} )
    this.setStateDataSelectedNode( value )
  }

  handleNodeSelection ( nodeLabel ) {
    let nodes = this.state.data.nodes.filter( node => { return node.label == nodeLabel })
    if ((nodes!==null) &&
        (Array.isArray(nodes)) &&
        (nodes.length>0) &&
        (nodes[0]!==null)) {
      console.log('nodeLabel is',nodeLabel,'node selected is', nodes)
      this.setState( {selectedNode: nodes[0] })
    } else {
      console.error('Selected node',nodeLabel,'not found')
  }
  }

  deselectAllNodes () {
    for (let node of this.state.data.nodes) { node.selected = false }
  }

  // Set the `selected` flag for any nodes that match `value`, and update the state
  // This data is passed on to the NetGraph component for rendering
  setStateDataSelectedNode( value ) {
    if (value==='') {
      this.deselectAllNodes()
      return
    }
    let updatedData = this.state.data
    updatedData.nodes = this.state.data.nodes.map( node => {
      if (node.label.toLowerCase().startsWith( value.toLowerCase() )) {
        // console.log('...setting selected',node.label,'matches',value)
        node.selected = true
      } else {
        node.selected = false
      }
      return node
    })
    this.setState( { data: updatedData })
  }

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
        <p>The goal here is to try to develop an autocomplete component that 
        wraps the react-autosuggest component in a manner that is going to work
        well for Net.Create.</p>
        <p>INSTRUCTIONS: Type in the "Nodes" input field to highlight nodes.</p>
        <div style={{display:'flex', flexFlow:'row nowrap',
             width:'100%', height:'100%'}}>
          <div id="left" style={{backgroundColor:'#E0ffff',flex:'1 0 auto',maxWidth:'300px',padding:'10px'}}>
            <div style={{display:'flex', flexFlow:'column nowrap',height:100+'%'}}>
              <div style={{flexGrow:1}}>
                <h3>Nodes</h3>
                <AutoComplete 
                  lexicon={this.state.lexicon}
                  onInputChange={this.handleInputChange}
                  onSelection={this.handleNodeSelection}
                />
              </div>
              <div>
                <NodeDetail
                  selectedNode={this.state.selectedNode}
                />
              </div>
            </div>
          </div>
          <div id="middle" style={{backgroundColor:'#fcfcfc', flex:'3 0 auto', padding:'10px'}}>
            <NetGraph 
              data={this.state.data}
              nodeSearchString={this.state.nodeSearchString}
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
