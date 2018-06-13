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
      isEditable:      false,
      isExpanded:      false,     // Summary view vs Expanded view
    };

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    // UDATA.OnStateChange('SELECTION',(data)=>{
    //   this.handleSelection(data.edges);
    // });

    this.onButtonClick = this.onButtonClick.bind(this);

  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS
  ///
  onButtonClick () {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// REACT LIFECYCLE
  ///
  componentWillReceiveProps (nextProps) {
    // 1. set edgeID
    let edgeID = nextProps.edgeID || {}

    // 2. set parentNodeLabel
    this.setState({
      parentNodeLabel: nextProps.parentNodeLabel
    });


    // 3. Load edge, source, and target node data
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
    if (this.state.isExpanded) {
      // Show Full Information
      return (
        <Form className="nodeEntry"
              style={{minHeight:'300px',backgroundColor:'#caf1c7',padding:'5px',marginBottom:'10px'}}
        >
          <FormText>EDGE</FormText>
          <FormGroup>
            <Input type="text" name="source" id="source"
              value={sourceNode.label}
              readOnly={true}
            />
          </FormGroup>
          <FormGroup>
            <Input type="text" name="relationship" id="relationship"
              value={formData.relationship}
              readOnly={true}
            />
          </FormGroup>
          <FormGroup>
            <Input type="text" name="target" id="target"
              value={targetNode.label}
              readOnly={true}
            />
          </FormGroup>
          <FormGroup>
            <Input type="text" name="notes" id="notes"
              value={formData.notes}
              readOnly={true}
            />
          </FormGroup>
          <FormGroup>
            <Input type="text" name="info" id="info"
              value={formData.info}
              readOnly={true}
            />
          </FormGroup>
          <FormGroup>
            <Input type="text" name="id" id="id"
              value={formData.id}
              readOnly={true}
            />
          </FormGroup>
          <Button size="sm" onClick={this.onButtonClick}>Done</Button>
        </Form>
      );

    } else {
      // Show Summary Information
      return (
        <Button
          outline
          size="sm"
          style={{width:'100%'}}
          onClick={this.onButtonClick}
        >{parentNodeLabel===sourceNode.label ? me : sourceNode.label}
        &nbsp;&#x2794;&nbsp;
        {parentNodeLabel===targetNode.label ? me : targetNode.label}</Button>
      );
    }
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeEditor;
