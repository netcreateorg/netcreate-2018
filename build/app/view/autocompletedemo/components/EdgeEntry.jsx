/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    Edge Entry

    Form for selecting and editing Edge information.

    TO USE

          <EdgeEntry 
            data={this.state.data}
            selectedSourceNode={this.state.selectedSourceNode}
            selectedTargetNode={this.state.selectedTargetNode}

            onInputUpdate={this.handleTargetInputUpdate}
            onHighlight={this.handleTargetHighlight}
            onNodeSelect={this.handleTargetNodeSelection}
            onEdgeUpdate={this.handleEdgeUpdate}
          />


    PROPS SETTERS (data from Parent)

          data            Used to pass the current graph data from the parent 
                          component to NodeSelector

          selectedSourceNode    Set the source node selected by NodeSelector

          selectedTargetNode    Set the target node selected locally


    PROPS HANDLERS (data sent to Parent)

          onInputUpdate   A callback function, called whenever user types in 
                          search field

          onHighlight     A callback function, called whenever user highlights
                          (mouses over) a suggestion

          onNodeSelect    A callback function that NodeSelect will call when the
                          user has selected a specific node either for viewing
                          or editing.  Used by EdgeEntry as the Source node.

    STATES
          data            Local version of graph data

          isEditable      If true, form is enabled for editing
                          If false, form is readonly

          selectedSourceNode
                          The source node for the edge, as selected externally
                          by NodeSelect.  This is set automatically.

          selectedNode    The currently selected node shown in the form.
                          This is the target node.

          highlightedNode The node that is currently highlighted in the list
                          of suggestions


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
class EdgeEntry extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      data:            {},
      selectedEdge: {
        sourceId:     '',
        targetId:     '',
        relationship: '',
        notes:        '',
        id:           '',
        isNewEdge:    true
      },
      selectedSourceNode: {
          label:     '',
          type:      '',
          info:      '',
          notes:     '',
          id:        ''
      },
      selectedNode: {
          label:     '',
          type:      '',
          info:      '',
          notes:     '',
          id:        ''
      },
      highlightedNode: {},
      isEditable:      false
    }

    this.clearForm                             = this.clearForm.bind(this)
    this.getNewEdgeID                          = this.getNewEdgeID.bind(this)
    this.showDataInForm                        = this.showDataInForm.bind(this)
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
      selectedEdge: {
        sourceId:     '',
        targetId:     '',
        relationship: '',
        notes:        '',
        id:           '',
        isNewEdge:    true
      },
      selectedNode: {
          label:     label,
          type:      '',
          info:      '',
          notes:     '',
          id:        '',
          isNewEdge: true
      },
      highlightedNode: {},
      isEditable:      false
    })
  }
  /// Return a new unique ID
  getNewEdgeID () {
    let ids  = this.state.data.edges.map( edge => { return edge.id } )
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
          isNewEdge: false
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
    // Update the local value
    let selectedNode = this.state.selectedNode
        selectedNode.label = searchValue
    this.setState({
      selectedNode: selectedNode
    })
    // console.log('NodeSelector.handleAutoCompleteInputChange setting label to',formData.label)
    // Notify parent of updated value
    this.props.onInputUpdate( searchValue )
  }
  /// The user has temporarily highlighted one of the suggestions
  /// Show the highlighted node, but let it get overriden by selection.
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
  ///
  /// When the target node is selected, look for a matching existing edge
  /// otherwise mark it a new edge
  handleAutoCompleteNodeSelection (nodeLabel) {
    // Does the node already exist?  If so, update it.
    let nodes = this.state.data.nodes.filter( node => { return appearsIn(nodeLabel,node.label) })
    if ((nodes!==null) &&
        (Array.isArray(nodes)) &&
        (nodes.length>0) &&
        (nodes[0]!==null)) {
      // Node is Valid!
      // console.info('nodeLabel is',nodeLabel,'node selected is', nodes)

      // 1. Set the Target Node
      // Read node values for form
      let node = nodes[0]
      this.setState({
        selectedNode: {
          label:     node.label,
          type:      node.attributes["Node_Type"],     // HACK This needs to be updated when 
          info:      node.attributes["Extra Info"],    // the data format is updated
          notes:     node.attributes["Notes"],         // These were bad keys from Fusion Tables.
          id:        node.id
        },
        isEditable: false
      })
      
      // 2. Propagate to parent to highlight
      this.props.onNodeSelect( node )
      
      // 3. Look for an existing edge
console.error('REVIEW>>>look for existing edge')

      // 4. No existing edges, just add it
      let edge = this.state.selectedEdge
      edge.targetId = node.id
      edge.isNewEdge = true
      this.setState({
        selectedEdge: edge
      })
    }
  }



  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS
  ///
  onLabelChange (label) {
    let node = this.state.selectedNode
    node.label = label
    this.setState({ selectedSourceNode: node })
    let edge = this.state.selectedEdge
    edge.label = label
    this.setState({ selectedEdge: edge }) 
  }
  onTypeChange  (event) { 
    let edge = this.state.selectedEdge
    edge.relationship = event.target.value
    this.setState({ selectedEdge: edge }) 
  }
  onNotesChange (event) { 
    let edge = this.state.selectedEdge
    edge.notes = event.target.value
    this.setState({ selectedEdge: edge }) 
  }
  onInfoChange  (event) { 
    let edge = this.state.selectedEdge
    edge.info = event.target.value
    this.setState({ selectedEdge: edge }) 
  }
  onEditButtonClick (event) {
    event.preventDefault()

    this.setState({ isEditable: true })
    let selectedEdge = this.state.selectedEdge
    
    // Add ID if one isn't already defined
    if (selectedEdge.id == '') selectedEdge.id = this.getNewEdgeID()
    this.setState({ selectedEdge: selectedEdge })
    
  }
  onSubmit ( event ) {
    event.preventDefault()

    let edge = this.state.selectedEdge
    console.group('EdgeEntry.onSubmit submitting',edge)

    // Notify parent of new edge data
    this.props.onEdgeUpdate( edge )
    // Notify parent to deselect selectedNode
    this.props.onNodeSelect( {} )

console.log('...About to clear form')
    // Clear the any selections
    this.clearForm()
    console.log('this.state.selectedEdge',this.state.selectedEdge)
console.log('...Clear form finished')

    console.groupEnd()

  }



  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// REACT LIFECYCLE
  ///
  componentDidMount () {
    // console.log('componentDidMount')
  }
  componentWillReceiveProps (nextProps) {
    console.log('componentWillReceiveProps',nextProps)
    console.log('this.state.selectedEdge',this.state.selectedEdge)
    let data = nextProps.data || {}
    this.setState({
      data:  data
    })

    // selectedSourceNode update
    let sourceNode = nextProps.selectedSourceNode
    let edge = this.state.selectedEdge
    if (sourceNode) {
        edge.sourceId = sourceNode.id
    }
    this.setState({ selectedSourceNode: sourceNode })

    // selectedTargetNode update
    // If parent passes an empty selectedTargetNode, then we
    // need to clear the form
    if (nextProps.selectedTargetNode=={}) {
      this.clearForm()
    } 
  }
  shouldComponentUpdate () { return true }
  componentWillUpdate () {}
  render () {
    return (
      <Form className='nodeEntry' style={{minHeight:'300px',backgroundColor:'#caf1c7',padding:'5px',marginBottom:'10px'}}
        onSubmit={this.onSubmit}>
        <FormText>EDGE SELECTOR</FormText>
        <hr/>
        <FormGroup>
          <Label for="source" className="small text-muted">SOURCE</Label>
          <Input type="text" name="source" id="source"
            value={this.props.selectedSourceNode ? this.props.selectedSourceNode.label : ''}
            readOnly={true}
          />
        </FormGroup>
        <FormGroup>
          <Label for="nodeLabel" className="small text-muted">TARGET</Label>
          <AutoComplete 
            data={this.state.data}
            value={this.state.selectedNode.label}
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
            value={this.state.selectedEdge.type||''}
            onChange={this.onTypeChange}
            disabled={!this.state.isEditable}
            >
            <option>Source provided consulting for target</option>
            <option>Source is responsible for leading target project</option>
            <option>Source worked on target project or for target person</option>
            <option>Source project or person uses target tool</option>
            <option>Source person is part of target department or center</option>
          </Input>
        </FormGroup>
        <FormGroup>
          <Label for="notes" className="small text-muted">NOTES</Label>
          <Input type="textarea" name="note" id="notesText" 
            value={this.state.selectedEdge.notes||''}
            onChange={this.onNotesChange}
            readOnly={!this.state.isEditable}
            />
        </FormGroup>
        <FormGroup>
          <Label for="info" className="small text-muted">APPROXIMATE DATE OF INTERACTION</Label>
          <Input type="text" name="info" id="info" 
            value={this.state.selectedEdge.info||''}
            onChange={this.onInfoChange}
            readOnly={!this.state.isEditable}
            />
        </FormGroup>
        <FormGroup row>
          <Label for="id" sm={2} className="small text-muted">ID</Label>
          <Col sm={10}>
            <Input type="text" name="id" id="id"
              value={this.state.selectedEdge.id||''}
              readOnly={true}
            />
          </Col>
        </FormGroup>
        <hr/>
        <FormGroup className="text-right" style={{paddingRight:'5px'}}>
          <Button outline size="sm"
            hidden={this.state.isEditable}
            onClick={this.onEditButtonClick}
          >{this.state.selectedEdge.isNewEdge?"Add New Edge":"Edit Edge"}</Button>
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
module.exports = EdgeEntry;
