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
      notes: ''
    }

    this.onLabelChange = this.onLabelChange.bind(this)
    this.onTypeChange  = this.onTypeChange.bind(this)
    this.onNotesChange = this.onNotesChange.bind(this)
    this.onInfoChange  = this.onInfoChange.bind(this)
    this.onSubmit      = this.onSubmit.bind(this)
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

  onSubmit ( event ) {
    event.preventDefault()
    this.props.onNewNode( this.state )
  }

  componentDidMount () {
    // console.log('componentDidMount')
  }

  componentWillReceiveProps (nextProps) {
    // console.log('componentWillReceiveProps')
    let node = nextProps.selectedNode || {}
    node.attributes = node.attributes || {}    // validate attributes
    this.setState({
      label: node.label,
      type:  node.attributes["Node_Type"],     // HACK This needs to be updated when 
      info:  node.attributes["Extra Info"],    // the data format is updated
      notes: node.attributes["Notes"]          // These were bad keys from Fusion Tables.
    })
  }
  
  shouldComponentUpdate () { return true }

  componentWillUpdate () {}

  render () {
    return (
      <Form style={{minHeight:'300px',backgroundColor:'#c7f1f1',padding:'5px',marginBottom:'10px'}}
        onSubmit={this.onSubmit}>
        <FormText>NEW NODE</FormText>
        <hr/>
        <FormGroup>
          <Label for="nodeLabel">Label</Label>
          <Input type="text" name="nodeLabel" id="nodeLabel" 
            onChange={this.onLabelChange}
            placeholder="person/group/place/thing/event" />
        </FormGroup>
        <FormGroup>
          <Label for="type">Type</Label>
          <Input type="select" name="type" id="typeSelect"
            onChange={this.onTypeChange}>
            <option>Person</option>
            <option>Group</option>
            <option>Place</option>
            <option>Thing</option>
            <option>Event</option>
          </Input>
        </FormGroup>
        <FormGroup>
          <Label for="notes">Notes</Label>
          <Input type="textarea" name="note" id="notesText" 
            onChange={this.onNotesChange}/>
        </FormGroup>
        <FormGroup>
          <Label for="info">Geocode or Date</Label>
          <Input type="text" name="info" id="info" 
            onChange={this.onInfoChange}/>
        </FormGroup>
        <Button>Create</Button>
      </Form>
    )
  }

  componentDidUpdate () {}

  componentWillUnMount () {}

}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NodeEntry;
