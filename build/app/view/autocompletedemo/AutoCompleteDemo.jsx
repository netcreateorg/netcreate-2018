/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const d3           = require('d3');
const AutoComplete = require('./components/AutoComplete');
const NetGraph     = require('./components/NetGraph');
const NodeSelector = require('./components/NodeSelector');
const NodeDetail   = require('./components/NodeDetail');
const ReactStrap   = require('reactstrap')
const { FormText } = ReactStrap

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

  deselectAllNodes () {
    for (let node of this.state.data.nodes) { node.selected = false }
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
                  selectedColor="#0000FF"
                />
                <NodeSelector 
                  data={this.state.data}
                  onDataUpdate={this.updateData}
                  selectedColor="#EE0000"
                />
                  selectedNode={this.state.selectedNode}
                  onNewNode={this.handleNewNode}
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
