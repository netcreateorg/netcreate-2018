/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  The DuplicateNodeDialog is displayed when the user is trying to add a new
  node that share the same label as an existing node.  It presents the user
  with two options:
  * Edit the existing ndoe
  * Continue adding the new node
  
  The dialog is displayed next to the node label so that the user can make
  a decision.
  
  We allow duplicate nodes because there might be places/people with the
  same name.
  
  ## PROPS
      nodeID


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = true;


/// UNISYS INITIALIZE REQUIRES for REACT ROOT /////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require('unisys/client');
var   UDATA  = null;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Button } = ReactStrap;
const classnames = require('classnames');

const Help = require('./Help');
const NodeTable = require('./NodeTable');
const EdgeTable = require('./EdgeTable');


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class SaveChangesDialog extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodePrompts: this.AppState('TEMPLATE').nodePrompts,
    }

    this.handleEdit = this.handleEdit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

  } // constructor



  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Select the node for editing
  /*/
  handleEdit(event) {
    event.preventDefault();
    let nodeID = parseInt(event.target.value);
    UDATA.LocalCall('SOURCE_SELECT', { nodeIDs: [nodeID] });
  }

  handleCancel () {
    event.preventDefault();
    
  }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This is not yet implemented as of React 16.2.  It's implemented in 16.3.
      getDerivedStateFromProps (props, state) {
        console.error('getDerivedStateFromProps!!!');
      }
  /*/
  /*/ This this fires after render().
  /*/
  componentDidMount() {
    let tabpanel = document.getElementById('tabpanel');
    this.setState({
      tabpanelTop: tabpanel.offsetTop
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
  /*/
  render() {
    let { nodePrompts } = this.state;
    return (
      <Modal>
        <ModalBody>You've made changes to the Node.  Are you sure you want to </ModalBody>
      </Modal>
    );
  }

} // class SaveChangesDialog


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SaveChangesDialog;
