/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    Node Selector

    Form for selecting and editing Node information.

    NodeSelector does not modify any data.  It passes all events (text updates,
    highlights, and suggestion selections) up to the parent.  The parent
    object should process the events and update the data accordingly.  The
    updated data is then rendered by NodeSelect.


    TO USE

          <NodeSelector

            data                 = {this.state.data}
            selectedNode         = {this.state.selectedSourceNode}
            highlightedNodeLabel = {this.state.highlightedSourceNodeLabel}

            onInputUpdate        = {this.handleSourceInputUpdate}
            onHighlight          = {this.handleSourceHighlight}
            onNodeSelect         = {this.handleSourceNodeSelection}
            onNodeUpdate         = {this.handleNodeUpdate}

          />


    PROPS SETTERS (data from Parent)

          data            Used to pass the current graph data from the parent 
                          component to NodeSelector
          
          selectedNode    If the parent selects a node, pass the node here

          highlightedNodeLabel 
                          Currently highlighted label


    PROPS HANDLERS (data sent to Parent)

          onInputUpdate   A callback function, called whenever user types in 
                          search field

          onHighlight     A callback function, called whenever user highlights
                          (mouses over) a suggestion

          onNodeSelect    A callback function that NodeSelect will call when the
                          user has selected a specific node either for viewing
                          or editing.  Used by EdgeEntry as the Source node.

          onNodeUpdate    A callback function, called when the user edits an
                          existing node, or adds a new node.  This is passed
                          to the parent, which updates the data store.



    STATES
          data            Local version of graph data

          formData        Node data that is shown in the form

          isEditable      If true, form is enabled for editing
                          If false, form is readonly

          highlightedNode The node that is currently highlighted in the list
                          of suggestions.  This is a node object.  This
                          determines what is shown in NodeDetail.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/



/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react')
const ReactStrap   = require('reactstrap')
const { Button, Col, Form, FormGroup, Label, Input, FormText } = ReactStrap
const AutoComplete = require('./AutoComplete')
const NodeDetail   = require('./NodeDetail')



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
      data:                 {},

      formData: {
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
    this.loadFormFromNode                      = this.loadFormFromNode.bind(this)
    this.handleAutoCompleteInputChange         = this.handleAutoCompleteInputChange.bind(this)
    this.handleAutoCompleteNodeSelection       = this.handleAutoCompleteNodeSelection.bind(this)
    this.handleAutoCompleteSuggestionHighlight = this.handleAutoCompleteSuggestionHighlight.bind(this)
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
      formData: {
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
  /// Show node data in the form
  loadFormFromNode ( newNode ) {
    // Clean data
    let node = {attributes:{}}
    if (newNode.attributes===undefined) { newNode.attributes = {} }
    node.label                    = newNode.label || ''
    node.id                       = newNode.id    || ''
    node.attributes["Node_Type"]  = newNode.attributes["Node_Type"]  || ''
    node.attributes["Extra Info"] = newNode.attributes["Extra Info"] || ''
    node.attributes["Notes"]      = newNode.attributes["Notes"]      || ''

    // Copy to form
    this.setState({
      formData: {
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


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// AUTOCOMPLETE HANDLERS
  ///
  /// As the user types, dynamically update the currently selected nodes in the data
  /// this has a side effect of passing the data to the parent component via onDataUpdate
  handleAutoCompleteInputChange (searchValue) {
    // Update the local value
    let formData = this.state.formData
        formData.label = searchValue
    this.setState({
      formData: formData
    })
    // console.log('NodeSelector.handleAutoCompleteInputChange setting label to',formData.label)
    // Notify parent of updated value
    this.props.onInputUpdate( searchValue )
  }
  /// The user has temporarily highlighted one of the suggestions
  /// Show the highlighted node in NodeDetail, but let it get overriden by selection.
  handleAutoCompleteSuggestionHighlight (nodeLabel) {
    // Find first node that matches highlight
    if (nodeLabel===null) {
      // Unhighlight 
      this.setState({ highlightedNode: {} })
    } else {
      let nodes = this.state.data.nodes.filter( node => { return appearsIn(nodeLabel,node.label) })
      if ( (nodes!==null) &&
           (Array.isArray(nodes)) &&
           (nodes.length>0) &&
           (nodes[0]!==null) 
         ) {
        // Node is Valid!
        this.setState({ highlightedNode: nodes[0] })
      }
    }
    this.props.onHighlight( nodeLabel )
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
      // console.info('nodeLabel is',nodeLabel,'node selected is', nodes)
      // Read node values for form
      let node = nodes[0]
      this.setState({
        formData: {
          label:     node.label,
          type:      node.attributes["Node_Type"],     // HACK This needs to be updated when 
          info:      node.attributes["Extra Info"],    // the data format is updated
          notes:     node.attributes["Notes"],         // These were bad keys from Fusion Tables.
          id:        node.id,
          isNewNode: false
        },
        isEditable: false
      })
      // Propagate to parent
      this.props.onNodeSelect( node )
    }
  }




  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS
  ///
  onLabelChange (label) {
    let node = this.state.formData
    node.label = label
    this.setState({ formData: node })
  }
  onTypeChange  (event) { 
    let node = this.state.formData
    node.type = event.target.value
    this.setState({ formData: node }) 
  }
  onNotesChange (event) { 
    let node = this.state.formData
    node.notes = event.target.value
    this.setState({ formData: node }) 
  }
  onInfoChange  (event) { 
    let node = this.state.formData
    node.info = event.target.value
    this.setState({ formData: node }) 
  }
  onEditButtonClick (event) {
    event.preventDefault()

    // console.log('NodeSelector.onEditButtonClick')
    this.setState({ isEditable: true })

    // Add ID if one isn't already defined
    let formData = this.state.formData
    if (formData.id == '') formData.id = this.getNewNodeID()
    this.setState({ formData: formData })

  }
  onSubmit ( event ) {
    event.preventDefault()

    // Update the data with the selectedNode
    let newNodeData = this.state.formData
    // console.log('NodeSelector.onSubmit label is',newNodeData.label)
    let node = {
        label: newNodeData.label,
        id:    newNodeData.id,
        type:  newNodeData.type,
        info:  newNodeData.info,
        notes: newNodeData.notes
    }

    // Notify parent of new node data
    this.props.onNodeUpdate( node )
    // Notify parent to deselect selectedNode
    this.props.onNodeSelect( {} )

    // Clear form data
    this.clearForm()

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

    // sourceNodeLabel
    let node = nextProps.selectedNode
    // console.log('NodeSelector: RECEIVED nextProps.selectedNode',node)
    if (node!==undefined) {
      // Fill out the form
      // console.log('...updating form')
      this.loadFormFromNode( node )
    } else {
      this.clearForm()
    }
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
            value={this.state.formData.label}
            disableSuggestions={!this.state.isEditable}
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
            value={this.state.formData.type||''}
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
            value={this.state.formData.notes||''}
            onChange={this.onNotesChange}
            readOnly={!this.state.isEditable}
            />
        </FormGroup>
        <FormGroup>
          <Label for="info" className="small text-muted">GEOCODE or DATE</Label>
          <Input type="text" name="info" id="info" 
            value={this.state.formData.info||''}
            onChange={this.onInfoChange}
            readOnly={!this.state.isEditable}
            />
        </FormGroup>
        <FormGroup row>
          <Label for="id" sm={2} className="small text-muted">ID</Label>
          <Col sm={10}>
            <Input type="text" name="id" id="id"
              value={this.state.formData.id||''}
              readOnly={true}
            />
          </Col>
        </FormGroup>
        <hr/>
        <FormGroup className="text-right" style={{paddingRight:'5px'}}>
          <Button outline size="sm"
            hidden={this.state.isEditable}
            onClick={this.onEditButtonClick}
          >{this.state.formData.isNewNode?"Add New Node":"Edit Node"}</Button>
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
