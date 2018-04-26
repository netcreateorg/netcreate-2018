/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    Node Entry

    Form for entering Node information.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/



/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react')
const ReactStrap = require('reactstrap')
const { Button, Form, FormGroup, Label, Input, FormText } = ReactStrap


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NodeEntry extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      label: '',
      type: '',
      info: '',
      notes: '',
      canEdit: false
    }

    this.clearState        = this.clearState.bind(this)
    this.onLabelChange     = this.onLabelChange.bind(this)
    this.onTypeChange      = this.onTypeChange.bind(this)
    this.onNotesChange     = this.onNotesChange.bind(this)
    this.onInfoChange      = this.onInfoChange.bind(this)
    this.onEditButtonClick = this.onEditButtonClick.bind(this)
    this.onSubmit          = this.onSubmit.bind(this)
  }

  clearState () {
    this.setState({
      label: '',
      type: '',
      info: '',
      notes: '',
      canEdit: false
    })
  }

  onLabelChange (event) {
    this.setState({
      label: event.target.value
    })
  }

  onTypeChange (event) {
    this.setState({
      type: event.target.value
    })
  }

  onNotesChange (event) {
    this.setState({
      notes: event.target.value
    })
  }

  onInfoChange (event) {
    this.setState({
      info: event.target.value
    })
  }

  onEditButtonClick (event) {
    event.preventDefault()
    this.setState({ canEdit: true })
  }

  onSubmit ( event ) {
    event.preventDefault()
    let node = this.state
    delete node.canEdit
    this.props.onNewNode( node )
    this.clearState()
  }

  componentDidMount () {
    // console.log('componentDidMount')
  }

  componentWillReceiveProps (nextProps) {
    console.log('componentWillReceiveProps',nextProps)
    let node = nextProps.selectedNode || {}
    node.attributes = node.attributes || {}    // validate attributes
    this.setState({
      label:   node.label,
      type:    node.attributes["Node_Type"],     // HACK This needs to be updated when 
      info:    node.attributes["Extra Info"],    // the data format is updated
      notes:   node.attributes["Notes"],         // These were bad keys from Fusion Tables.
      canEdit: node.newNode                      // Pass canEdit=true to set NodeEntry into Edit mode
    })
  }
  
  shouldComponentUpdate () { return true }

  componentWillUpdate () {}

  render () {
    return (
      <Form className='nodeEntry' style={{minHeight:'300px',backgroundColor:'#c7f1f1',padding:'5px',marginBottom:'10px'}}
        onSubmit={this.onSubmit}>
        <FormText>NEW NODE</FormText>
        <hr/>
        <FormGroup>
          <Label for="nodeLabel" className="small text-muted">LABEL</Label>
          <Input type="text" name="nodeLabel" id="nodeLabel" 
            value={this.state.label||''}    // necessary to prevent switching from controlled to uncontrolled
            onChange={this.onLabelChange}
            placeholder="person/group/place/thing/event" 
            readOnly={!this.state.canEdit}
            />
        </FormGroup>
        <FormGroup>
          <Label for="type" className="small text-muted">TYPE</Label>
          <Input type="select" name="type" id="typeSelect"
            value={this.state.type||''}
            onChange={this.onTypeChange}
            readOnly={!this.state.canEdit}
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
            value={this.state.notes||''}
            onChange={this.onNotesChange}
            readOnly={!this.state.canEdit}
            />
        </FormGroup>
        <FormGroup>
          <Label for="info" className="small text-muted">GEOCODE or DATE</Label>
          <Input type="text" name="info" id="info" 
            value={this.state.info||''}
            onChange={this.onInfoChange}
            readOnly={!this.state.canEdit}
            />
        </FormGroup>
        <hr/>
        <FormGroup className="text-right" style={{paddingRight:'5px'}}>
          <Button outline size="sm"
            hidden={this.state.canEdit}
            onClick={this.onEditButtonClick}
          >Edit</Button>
          <Button color="primary" size="sm" 
            hidden={!this.state.canEdit}
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
module.exports = NodeEntry;
