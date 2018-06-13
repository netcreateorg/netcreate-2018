/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Edge Editor

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


var DBG = true;


/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Col, Form, FormGroup, Label, Input, FormText } = ReactStrap;
const AutoComplete = require('./AutoComplete');
const NodeDetail   = require('./NodeDetail');

const UNISYS   = require('system/unisys');
var   UDATA    = null;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class EdgeEditor extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      parentNodeLabel: '',        // Used to hide redundant parent node label info
      formData: {
        sourceId:     '',
        targetId:     '',
        relationship: '',
        notes:        '',
        id:           '',
        isNewEdge:    true
      },
      sourceNode: {
          label:     '',
          type:      '',
          info:      '',
          notes:     '',
          id:        ''
      },
      targetNode: {
          label:     '',
          type:      '',
          info:      '',
          notes:     '',
          id:        ''
      },
      highlightedNode: {},
      isEditable:      false
    };

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    // UDATA.OnStateChange('SELECTION',(data)=>{
    //   this.handleSelection(data.edges);
    // });

  }

  componentWillReceiveProps (nextProps) {
    let edgeID = nextProps.edgeID || {}

    this.setState({
      parentNodeLabel: nextProps.parentNodeLabel
    });

    let D3DATA = UDATA.State('D3DATA');

    let edges = D3DATA.edges.filter( edge=>edge.id===edgeID );
    if (!edges) {
      throw 'EdgeEditor: Passed edgeID',edgeID,'not found!';
      return;
    }
    let edge = edges[0];

    let sourceNodes = D3DATA.nodes.filter( node => node.id===edge.source.id );
    if (!sourceNodes) {
      throw 'EdgeEditor: Source ID',edge.source,'not found!';
      return;
    }
    let sourceNode = sourceNodes[0];

    let targetNodes = D3DATA.nodes.filter( node => node.id===edge.target.id );
    if (!targetNodes) {
      throw 'EdgeEditor: Target ID',edge.target,'not found!';
      return;
    }
    let targetNode = targetNodes[0];

    this.setState({
      formData: {
        id:           edge.id,
        sourceId:     edge.source,
        targetId:     edge.target,
        relationship: edge.attributes["Relationship"],
        info:         edge.attributes["Citations"],
        notes:        edge.attributes["Notes"],
        isNewEdge:    false
      },
      sourceNode: sourceNode,
      targetNode: targetNode
    })
  }

  render () {
    const { formData, sourceNode, targetNode, parentNodeLabel } = this.state;
    const me = 'me';
    return (
      <div>{parentNodeLabel===sourceNode.label ? me : sourceNode.label} &#x2794; {parentNodeLabel===targetNode.label ? me : targetNode.label}</div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeEditor;
