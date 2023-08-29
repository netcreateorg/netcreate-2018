/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Node Detail is a display widget that shows all of the meta information
  contained in each data node.

  If label is undefined the component will not be shown.

  Node Detail automatically shows the SELECTION.hilitedNode object.


  ## TO USE

    Add the following to the render() of the parent component:

      render() {
        return (
          ...
                <NodeDetail/>
          ...
        )
      }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const ReactStrap = require('reactstrap');
const { Table, FormText } = ReactStrap;
const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var DBG = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NodeDetail extends UNISYS.Component {
  constructor(props) {
    super(props);
    this.state = {
      label: undefined,
      type: '',
      info: '',
      notes: ''
    };
    this.handleSelection = this.handleSelection.bind(this);

    // Always make sure that class methods are bind()'d before
    // assigning them to a handler
    this.OnAppStateChange('SELECTION', stateChange => {
      this.handleSelection(stateChange.hilitedNode);
    });
  } // constructor

  /// UI HANDLERS ///////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  handleSelection(hilitedNode) {
    let node = hilitedNode || {};
    node.attributes = node.attributes || {}; // validate attributes
    this.setState({
      label: node.label,
      type: node.type,
      info: node.info,
      notes: node.notes
    });
  } // handleSelection

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  render() {
    return (
      <div
        className={this.state.label === undefined ? 'd-none' : ''}
        style={{
          minHeight: '300px',
          minWidth: '240px',
          backgroundColor: '#c7f1f1',
          padding: '5px',
          marginBottom: '10px'
        }}
      >
        <FormText>NODE DETAIL (RF)</FormText>
        <Table borderless striped size="sm">
          <tbody>
            <tr>
              <td>Label:&nbsp;&nbsp;</td>
              <td>{this.state.label}</td>
            </tr>
            <tr>
              <td>Type: </td>
              <td>{this.state.type}</td>
            </tr>
            <tr>
              <td>Notes:</td>
              <td>{this.state.notes}</td>
            </tr>
            <tr>
              <td>Info: </td>
              <td>{this.state.info}</td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  }
} // class NodeDetail

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NodeDetail;
