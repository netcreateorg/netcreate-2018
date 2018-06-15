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
        info:         '',
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
    if (this.state.isExpanded) {
      // collapse
      this.setState({ isExpanded: false });

      // pass currentAutoComplete back to nodeselector
      UDATA.Call('AUTOCOMPLETE_SELECT',{id:'nodeSelector'});
    } else {
      // expand
      this.setState({ isExpanded: true });

      // set this autoComplete as current
      UDATA.Call('AUTOCOMPLETE_SELECT',{id:'edge'+this.state.targetNode.id+'source'});
    }
  }

  loadSourceAndTarget () {
    let edgeID = this.props.edgeID || {}


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
        id:           edge.id || '',
        sourceId:     edge.source,
        targetId:     edge.target,
        relationship: edge.attributes["Relationship"] || '',   // Make sure there's valid data
        info:         edge.attributes["Citations"] || '',
        notes:        edge.attributes["Notes"] || '',
        isNewEdge:    false
      },
      sourceNode: sourceNode,
      targetNode: targetNode,
      parentNodeLabel: this.props.parentNodeLabel
    })
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// REACT LIFECYCLE
  ///

  // componentWillReceiveProps has been deprectaed by React.  Don't use!
  // componentWillReceiveProps (nextProps) {
  // }

  render () {
    const { formData, sourceNode, targetNode, parentNodeLabel } = this.state;
    const me = 'me';
    return (
      <div>

        <Button
          className={this.state.isExpanded?'d-none':''}
          outline
          size="sm"
          style={{width:'100%'}}
          onClick={this.onButtonClick}
        >{parentNodeLabel===sourceNode.label ? me : sourceNode.label}
        &nbsp;&#x2794;&nbsp;
        {parentNodeLabel===targetNode.label ? me : targetNode.label}</Button>

        <div className={this.state.isExpanded?'':'d-none'}>
          <Form className="nodeEntry"
                style={{minHeight:'300px',backgroundColor:'#caf1c7',padding:'5px',marginBottom:'10px'}}
          >
            <FormText>EDGE</FormText>
            <FormGroup>
              <Label for="source" className="small text-muted">SOURCE</Label>
             {/* TODO Set mode when new */}
              <AutoComplete
                identifier={'edge'+formData.id+'source'}
                disabledValue={sourceNode.label}
                inactiveMode={parentNodeLabel===sourceNode.label ? 'static' : 'disabled'}
              />
            </FormGroup>
            <FormGroup>
              <Label for="relationship" className="small text-muted">TYPE</Label>
              <Input type="text" name="relationship" id="relationship"
                value={formData.relationship}
                readOnly={true}
              />
            </FormGroup>
            <FormGroup>
              <Label for="nodeLabel" className="small text-muted">TARGET</Label>
              {/* TODO Set mode when new */}
              <AutoComplete
                identifier={'edge'+formData.id+'target'}
                disabledValue={targetNode.label}
                inactiveMode={parentNodeLabel===targetNode.label ? 'static' : 'disabled'}
              />
            </FormGroup>
            <FormGroup>
              <Label for="notes" className="small text-muted">NOTES</Label>
              <Input type="text" name="notes" id="notes"
                value={formData.notes}
                readOnly={true}
              />
            </FormGroup>
            <FormGroup>
              <Label for="info" className="small text-muted">APPROXIMATE DATE OF INTERACTION</Label>
              <Input type="text" name="info" id="info"
                value={formData.info}
                readOnly={true}
              />
            </FormGroup>
            <FormGroup>
              <Label for="id" sm={2} className="small text-muted">ID</Label>
              <Input type="text" name="id" id="id"
                value={formData.id}
                readOnly={true}
              />
            </FormGroup>
            <FormGroup className="text-right" style={{paddingRight:'5px'}}>
              <a href="#" className="small text-muted float-left">DELETE</a>&nbsp;
              <Button outline size="sm"
                hidden={this.state.isEditable}
                onClick={this.onEditButtonClick}
              >{this.state.isEditable?"Add New Edge":"Edit Edge"}</Button>&nbsp;
              <Button size="sm" onClick={this.onButtonClick}>Done</Button>&nbsp;
              <Button color="primary" size="sm"
                hidden={!this.state.isEditable}
                disabled={(!this.state.isEditable) &&
                          ( !this.state.formData.source ||
                            !this.state.formData.target )}
              >Save</Button>
            </FormGroup>
          </Form>
        </div>

      </div>
    );
  }

  componentDidMount () {
    this.loadSourceAndTarget();
  }

}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeEditor;
