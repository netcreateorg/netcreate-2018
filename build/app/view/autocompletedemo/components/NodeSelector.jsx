/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    Node Selector

    Form for selecting and editing Node information.

    TO USE

          <NodeSelector
            data={this.state.data}          // Set data from parent
            onDataUpdate={this.updateData}  // Handle data updates from NodeSelector
          />


    PROPS
          data            Used to pass the current graph data from the parent 
                          component to NodeSelector

          onDataUpdate    A callback function that NodeSelect will call when data 
                          has been updated

          selectedColor   Set the color of the highlight graph node for any
                          nodes selected by the NodeSelector


    STATES
          data            Local version of graph data

          isEditable      If true, form is enabled for editing
                          If false, form is readonly

          selectedNode    The currently selected node shown in the form.

          highlightedNode The node that is currently highlighted in the list
                          of suggestions

          requestClearValue   This is passed to the AutoComplete field when we
                              we want to clear the input field after submiting
                              the form data.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/



/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react')
const AutoComplete = require('./AutoComplete')
const NodeDetail   = require('./NodeDetail')
const ReactStrap   = require('reactstrap')
const { Button, Col, Form, FormGroup, Label, Input, FormText } = ReactStrap



/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DESELECTED_COLOR = ''

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// REVIEW: These are duplicated in AutoComplete. Pull out as utilites?
/// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
const escapeRegexCharacters = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const appearsIn = (searchValue, targetString) => {
  if (typeof searchValue !== 'string') { return false }
  const escapedLabel = escapeRegexCharacters(searchValue.trim())
  if (escapedLabel === '') { return false }
  const regex = new RegExp(escapedLabel, 'i') // case insensitive
  return regex.test(targetString)
};

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NodeSelector extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      data:            {},
      selectedNode: {
          label:     '',
          type:      '',
          info:      '',
          notes:     '',
          id:        '',
          isNewNode: true
      },
      highlightedNode: {},
      isEditable:      false
    }

    this.clearForm                             = this.clearForm.bind(this)
    this.getNewNodeID                          = this.getNewNodeID.bind(this)
    this.showDataInForm                        = this.showDataInForm.bind(this)
    this.handleAutoCompleteInputChange         = this.handleAutoCompleteInputChange.bind(this)
    this.handleAutoCompleteNodeSelection       = this.handleAutoCompleteNodeSelection.bind(this)
    this.handleAutoCompleteSuggestionHighlight = this.handleAutoCompleteSuggestionHighlight.bind(this)
    this.updateSelectedNodes                   = this.updateSelectedNodes.bind(this)
    this.deselectAllNodes                      = this.deselectAllNodes.bind(this)
    this.onLabelChange                         = this.onLabelChange.bind(this)
    this.onTypeChange                          = this.onTypeChange.bind(this)
    this.onNotesChange                         = this.onNotesChange.bind(this)
    this.onInfoChange                          = this.onInfoChange.bind(this)
    this.onEditButtonClick                     = this.onEditButtonClick.bind(this)
    this.onSubmit                              = this.onSubmit.bind(this)
  }



  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UTILITIES
  ///
  /// Clear the form with optional label
  clearForm ( label='' ) {
    this.setState({
      selectedNode: {
          label:     label,
          type:      '',
          info:      '',
          notes:     '',
          id:        '',
          isNewNode: true
      },
      highlightedNode: {},
      isEditable:      false
    })
  }
  /// Return a new unique ID
  getNewNodeID () {
    let ids  = this.state.data.nodes.map( node => { return node.id } )
    let highestID = ids.reduce( (a,b) => { return Math.max(a,b) } )
    return highestID+1
  }
  /// Show the first node that matches the nodeLabel in the form
  showDataInForm (nodeLabel) {
    let nodes = this.state.data.nodes.filter( node => { return appearsIn(nodeLabel,node.label) })
    if ((nodes!==null) &&
        (Array.isArray(nodes)) &&
        (nodes.length>0) &&
        (nodes[0]!==null)) {
      // Node is Valid!
      // console.log('nodeLabel is',nodeLabel,'node selected is', nodes)
      // Read node values for form
      let node = nodes[0]
      this.setState({
        selectedNode: {
          label:     node.label,
          type:      node.attributes["Node_Type"],     // HACK This needs to be updated when 
          info:      node.attributes["Extra Info"],    // the data format is updated
          notes:     node.attributes["Notes"],         // These were bad keys from Fusion Tables.
          id:        node.id,
          isNewNode: false
        },
        isEditable: false
      })
    }
  }



  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// AUTOCOMPLETE HANDLERS
  ///
  /// As the user types, dynamically update the currently selected nodes in the data
  /// this has a side effect of passing the data to the parent component via onDataUpdate
  handleAutoCompleteInputChange (searchValue) {
    this.updateSelectedNodes( searchValue )
    this.setState({requestClearValue:false})       // Data has been input, so don't clear
    if (this.state.isEditable) { 
      this.onLabelChange( searchValue )            // In edit mode, so update the input
    } else {
      this.clearForm( searchValue )                // Not in edit mode, update input and clear rest of form
    }
  }
  /// The user has selected one of the suggestions
  /// Update the selected data, and notify the parent
  handleAutoCompleteNodeSelection (nodeLabel) {
    // Does the node already exist?  If so, update it.
    let nodes = this.state.data.nodes.filter( node => { return appearsIn(nodeLabel,node.label) })
    if ((nodes!==null) &&
        (Array.isArray(nodes)) &&
        (nodes.length>0) &&
        (nodes[0]!==null)) {
      // Node is Valid!
      console.info('nodeLabel is',nodeLabel,'node selected is', nodes)
      // Read node values for form
      let node = nodes[0]
      this.setState({
        selectedNode: {
          label:     node.label,
          type:      node.attributes["Node_Type"],     // HACK This needs to be updated when 
          info:      node.attributes["Extra Info"],    // the data format is updated
          notes:     node.attributes["Notes"],         // These were bad keys from Fusion Tables.
          id:        node.id,
          isNewNode: false
        },
        isEditable: false
      })
      // Mark the node as 'selected'
      this.updateSelectedNodesById( node.id )
    } else {
      // No node was found, create a new node?

      if (nodeLabel && nodeLabel.isAddNew) {
        // User is in the middle of typing a new label, but hasn't clicked "Add New"
        // so ignore it for now.

      } else if (nodeLabel!=='') {
        // User clicked "Add New", and there is new label text, so create a new node
        let node = {isNewNode: true, label: nodeLabel, type:'', info:'', notes:'', id:this.getNewNodeID()}
        this.setState( {
          selectedNode: node,
          isEditable:   true
        } )
        // console.error('Selected node',nodeLabel,'not found')

      } else {
        // Nothing selected, clear the newNode flag and the form
        let node = {isNewNode: true, label:'', type:'', info:'', notes:'', id:''}
        this.setState( {selectedNode: node} )

      }
    }

  }
  /// The user has temporarily highlighted one of the suggestions
  /// Show the highlighted node, but let it get overriden by selection.
  handleAutoCompleteSuggestionHighlight (nodeLabel) {
    // Does the node already exist?  If so, update it.
    if (nodeLabel===null) {
      // console.log('unhighlight')
      this.setState({
        highlightedNode: {}
      })
      return
    }
    let nodes = this.state.data.nodes.filter( node => { return appearsIn(nodeLabel,node.label) })
    if ( (nodes!==null) &&
         (Array.isArray(nodes)) &&
         (nodes.length>0) &&
         (nodes[0]!==null) 
       ){
          // Node is Valid!
          // Read node values for form
          let node = nodes[0]
          this.setState({
            highlightedNode: node
          })
          // Also update graph highlight
          this.updateSelectedNodes( node.label )
    }
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
        node.selected = this.props.selectedColor
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
        node.selected = this.props.selectedColor
      } else {
        node.selected = this.getDeselectedNodeColor( node )
      }
      return node
    })
    this.setState( { data: updatedData })
    // Notify the parent
    this.props.onDataUpdate( updatedData )
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
  /// UI EVENT HANDLERS
  ///
  onLabelChange (label) {
    let node = this.state.selectedNode
    node.label = label
    this.setState({ selectedNode: node })
  }
  onTypeChange  (event) { 
    let node = this.state.selectedNode
    node.type = event.target.value
    this.setState({ selectedNode: node }) 
  }
  onNotesChange (event) { 
    let node = this.state.selectedNode
    node.notes = event.target.value
    this.setState({ selectedNode: node }) 
  }
  onInfoChange  (event) { 
    let node = this.state.selectedNode
    node.info = event.target.value
    this.setState({ selectedNode: node }) 
  }
  onEditButtonClick (event) {
    event.preventDefault()
    this.setState({ isEditable: true })
    let selectedNode = this.state.selectedNode
    // Add ID if one isn't already defined
    if (selectedNode.id == '') selectedNode.id = this.getNewNodeID()
    this.setState({ selectedNode: selectedNode })
    // Update graph data selections
    this.updateSelectedNodesById( selectedNode.id )
  }
  onSubmit ( event ) {
    event.preventDefault()
    // Update the data with the selectedNode
    let newNodeData = this.state.selectedNode
    let updatedData = this.state.data
    if (newNodeData.isNewNode) {
      // Add a new node
      let newNode = {
          label:          newNodeData.label,
          id:             newNodeData.id,
          attributes: {
            "Node_Type":  newNodeData.type,
            "Extra Info": newNodeData.info,
            "Notes":      newNodeData.notes
          }
      }
      updatedData.nodes.push( newNode )
    } else {
      // Update existing node
      updatedData.nodes = this.state.data.nodes.map( node => {
        if (node.id === newNodeData.id) {
          node.label                    = newNodeData.label
          node.attributes["Node_Type"]  = newNodeData.type
          node.attributes["Extra Info"] = newNodeData.info
          node.attributes["Notes"]      = newNodeData.notes
          node.id                       = newNodeData.id
        }
        return node
      })
    }
    // Notify parent
    this.props.onDataUpdate( updatedData )
    // Clear the any selections
    this.clearForm()
    // Clear the AutoComplete field
    this.setState({requestClearValue:true})
  }



  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// REACT LIFECYCLE
  ///
  componentDidMount () {
    // console.log('componentDidMount')
  }
  componentWillReceiveProps (nextProps) {
    // console.log('componentWillReceiveProps',nextProps)
    let data = nextProps.data || {}
    this.setState({
      data:  data
    })
  }
  shouldComponentUpdate () { return true }
  componentWillUpdate () {}
  render () {
    return (
      <Form className='nodeEntry' style={{minHeight:'300px',backgroundColor:'#c7f1f1',padding:'5px',marginBottom:'10px'}}
        onSubmit={this.onSubmit}>
        <FormText>NODE SELECTOR</FormText>
        <hr/>
        <FormGroup>
          <Label for="nodeLabel" className="small text-muted">LABEL</Label>
          <AutoComplete 
            data={this.state.data}
            disableSuggestions={!this.state.isEditable}
            requestClearValue={this.state.requestClearValue}
            onInputChange={this.handleAutoCompleteInputChange}
            onHighlight={this.handleAutoCompleteSuggestionHighlight}
            onSelection={this.handleAutoCompleteNodeSelection}
          />
        </FormGroup>
        <div style={{position:'absolute',left:'300px',maxWidth:'300px'}}>
          <NodeDetail 
            selectedNode={this.state.highlightedNode}
          />
        </div>
        <FormGroup>
          <Label for="type" className="small text-muted">TYPE</Label>
          <Input type="select" name="type" id="typeSelect"
            value={this.state.selectedNode.type||''}
            onChange={this.onTypeChange}
            disabled={!this.state.isEditable}
            >
            <option>Person</option>
            <option>Group</option>
            <option>Place</option>
            <option>Thing</option>
            <option>Event</option>
          </Input>
        </FormGroup>
        <FormGroup>
          <Label for="notes" className="small text-muted">NOTES</Label>
          <Input type="textarea" name="note" id="notesText" 
            value={this.state.selectedNode.notes||''}
            onChange={this.onNotesChange}
            readOnly={!this.state.isEditable}
            />
        </FormGroup>
        <FormGroup>
          <Label for="info" className="small text-muted">GEOCODE or DATE</Label>
          <Input type="text" name="info" id="info" 
            value={this.state.selectedNode.info||''}
            onChange={this.onInfoChange}
            readOnly={!this.state.isEditable}
            />
        </FormGroup>
        <FormGroup row>
          <Label for="id" sm={2} className="small text-muted">ID</Label>
          <Col sm={10}>
            <Input type="text" name="id" id="id"
              value={this.state.selectedNode.id||''}
              readOnly={true}
            />
          </Col>
        </FormGroup>
        <hr/>
        <FormGroup className="text-right" style={{paddingRight:'5px'}}>
          <Button outline size="sm"
            hidden={this.state.isEditable}
            onClick={this.onEditButtonClick}
          >{this.state.selectedNode.isNewNode?"Add New Node":"Edit Node"}</Button>
          <Button color="primary" size="sm" 
            hidden={!this.state.isEditable}
          >Save</Button>
        </FormGroup>
      </Form>
    )
  }
  componentDidUpdate () {}
  componentWillUnMount () {}

}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NodeSelector;
