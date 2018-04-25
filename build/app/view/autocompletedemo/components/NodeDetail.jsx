/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    Node Detail

    A display widget that shows all of the meta information contained in each 
    data node.

    TO USE
    Add the following to the render() of the parent component:

      render() {
        return (
          ...
                <NodeDetail
                  selectedNode={this.state.selectedNode}
                />
          ...
        )
      }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/



/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react')
const ReactStrap = require('reactstrap')
const { Table, FormText } = ReactStrap


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NodeDetail extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      label: '',
      type: '',
      info: '',
      notes: ''
    }
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
      <div style={{minHeight:'300px',backgroundColor:'#c7f1f1',padding:'5px',marginBottom:'10px'}}>
        <FormText>NODE DETAIL</FormText>
        <Table borderless="true" striped size="sm"><tbody>
          <tr><td>Label:&nbsp;&nbsp;</td><td>{this.state.label}</td></tr>
          <tr><td>Type: </td><td>{this.state.type}</td></tr>
          <tr><td>Notes:</td><td>{this.state.notes}</td></tr>
          <tr><td>Info: </td><td>{this.state.info}</td></tr>
        </tbody></Table>
      </div>
    )
  }

  componentDidUpdate () {}

  componentWillUnMount () {}

}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NodeDetail;
