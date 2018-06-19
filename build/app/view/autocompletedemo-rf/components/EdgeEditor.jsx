/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Edge Editor

    OVERVIEW
    --------

    EdgeEditor is used to to view, edit, and create new edges.


    The EdgeEditor has two basic views:

    1. Minimized Summary view displays just the source and target node info.

    2. Expanded View shows the full edge information.

    You can get an expanded view by clicking on the minized view.


    The expanded view has two modes:

    1. View Mode displays the edge data but does not allow editing.

    2. Edit Mode displays an editable form.


    We assume that when you create an edge, you will have already identified
    the source node, so the source node is never editable.

    We assume that once you create an edge, the only editing you might do
    is to change the relationship, notes, and citations.  You wouldn't
    change the source or target nodes.  If you need to change them, you'd
    use DELETE.




    TO USE
    ------

    EdgeEditors are usually included as a repeating element, e.g.

          <FormText>EDGES</FormText>
          {this.state.edges.map( (edge,i) =>
            <EdgeEditor key={i}
              edgeID={edge.id}
              parentNodeLabel={this.state.formData.label}
            />
          )}



    PROPS
    -----

    edgeID            edgeID provides a unique identifier for the EdgeEditor
                      displaying the particular edge.  The edgeID is
                      used to also uniquely identify the AutoComplete
                      fields within the EdgeEditor.

    parentNodeLabel   parentNodeLabel is the label of the source node that
                      the EdgeEditor is displayed within.  This is used
                      by the EdgeEditor to determine whether it should
                      display the edge nodes as targets or sources.


    TECHNICAL DESCRIPTION
    ---------------------



    TESTING
    -------

    Displaying Current Edge(s)
        0. When the app starts, no edges should be displayed in the Node Selector.
        1. Click on "Board of Health"
              * A summary view of the four nodes connected to Board of Health
                should be displayed.
        2. Click on "me -> Residents of Chinatown"
              * The form information should be displayed, including ID,
                relationship, info, and notes.
              * The form fields should be disabled (not able to be edited)
              * A "Done" button should appear.
              * A "Edit Edge" button should appear.
        3. Click "Done"
              * The "Residents of Chinatown" edge editor should collapse.
              * The other 3 Board of Health edges should still be dispalyed.
        4. Click outside of "Board of Health"
              * All edges should be removed.
        5. Click on a node without an edge, e.g. "Ah Sop"
              * No edges should be displayed
              * The "Add New Edge" button should be displayed in the EDGES area.


    Edit Existing Edge
        1. Click on "Board of Health"
        2. Click on "me -> Residents of Chinatown"
        3. Click on "Edit Edge"
              * WIP

    Create New Edge
        1. Click on "Board of Health"
        2. Click on "Add New Edge"
              * "Board of Health" should be automatically set as the Source field
              * A new ID "59" should be automatically inserted.
              * All fields except "Source" and "ID" should be editable.
              * A "Save" button should appear.
              * A "Done" button should NOT appear.
        3. Select a Type
              * There should be multiple type options available.
        4. Select a Target
              * The AutoComplete field should allow typing.
              * As you type you should see suggestions.
              * Each suggestion should be marked in the graph
              * You should be able to click on a suggestion from
                the suggestions list, or use the keyboard to
                select a suggestion.
        5. Type in some info.
              * The field text should update with whatever you type.
        6. Type in some notes.
              * The field text should update with whatever you type.
        7. Click "Save"
              * The selected target node should be connected to Board of Health
                in the graph.
              * The EdgeEditor form should be cleared.
              * The NodeSelector form should be cleared.
        8. Click on "Board of Health"
              * The new edge should be displayed as one of the edges.
        9. Click on the new target node summary view
              * You should see the relationship, type, and info changes.
        10. Click on the new target node in the graph
              * You should see the component along with an edge
                linked to "Board of Health"


    Delete Edge
        1. Click on "Board of Health"
        2. Click on "DELETE"
              * WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


var DBG = false;


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
      formData: {                 // Holds the state of the form fields
        sourceId:     '',
        targetId:     '',
        relationship: '',
        info:         '',
        notes:        '',
        id:           '',
        isNewEdge:    true
      },
      sourceNode: {               // Holds the current selected source node
          label:     '',
          type:      '',
          info:      '',
          notes:     '',
          id:        ''
      },
      targetNode: {               // Holds the current selected target node
          label:     '',
          type:      '',
          info:      '',
          notes:     '',
          id:        ''
      },
      isEditable:      false,     // Form is in an edtiable state
      isExpanded:      false,     // Show EdgeEditor Component in Summary view vs Expanded view
    };

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    UDATA.OnStateChange('SELECTION',(data)=>{
      this.handleSelection(data);
    });

    this.onButtonClick        = this.onButtonClick.bind(this);
    this.onDeleteButtonClick  = this.onDeleteButtonClick.bind(this);
    this.onEditButtonClick    = this.onEditButtonClick.bind(this);
    this.onRelationshipChange = this.onRelationshipChange.bind(this);
    this.onNotesChange        = this.onNotesChange.bind(this);
    this.onInfoChange         = this.onInfoChange.bind(this);
    this.onSubmit             = this.onSubmit.bind(this);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UTILITIES
  ///
  clearForm () {
    this.setState({
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
      isEditable:           false,
      isExpanded:           false,     // Summary view vs Expanded view
    });
  }

  /// Updates to the AutoComplete field happen via SELECTION
  /// For EdgeEditors, the active AutoComplete field is always
  /// the target, since the source is set by the initial selection
  handleSelection ( data ) {
    if (DBG) console.log('EdgeEditor: got state SELECTION',data);

    // Ignore the update if we're not the active AutoComplete component
    if (data.activeAutoCompleteId!=='edge'+this.props.edgeID+'target') return;

    if (this.state.isEditable) {
      if (data.nodes && data.nodes.length>0) {
        // A node was selected, so load it
        // We're not editing, so it's OK to update the form
        // grab the first node
        let node = data.nodes[0];
        this.setState({
          targetNode: node
        });
      } else {
        // Nothing selected yet, update the search label
        if (DBG) 'EdgeEditor: SELECTION sent with no nodes for'+'edge'+this.props.edgeID+'target';
        let formData = this.state.formData;
        formData.label = data.searchLabel;
        this.setState({
          formData: formData
        });
      }
    } else {
      // Edge is not being edited, so ignore the selection
    }
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
      UDATA.Call('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'target'});
    }
  }
  onDeleteButtonClick () {
    this.clearForm();
    UDATA.Call('EDGE_DELETE',{edgeID:this.props.edgeID});
  }
  onEditButtonClick () {
    this.setState({ isEditable: true });
    // set this autoComplete as current
    UDATA.Call('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'target'});
  }
  loadSourceAndTarget () {
    if (DBG) console.log('EdgeEditor.loadSourceAndTarget!')
    let edgeID = this.props.edgeID || '';


    let D3DATA = UDATA.State('D3DATA');

    let edges = D3DATA.edges.filter( edge=>edge.id===edgeID );
    if (!edges) {
      throw 'EdgeEditor: Passed edgeID',edgeID,'not found!';
      return;
    }
    let edge = edges[0];

    let sourceNode, sourceNodes, targetNode, targetNodes;

    if (edge===undefined) {

      // DEFINE NEW EDGE

      // Create a dummy empty edge object
      // This will be edited and saved
      if (DBG) console.log('...EdgeEditor.loadSourceAndTarget: New edge!  No target yet!');
      // Get a real source node, since we know the parent of this link is the currently
      // selected source node.
      sourceNodes = D3DATA.nodes.filter( node => node.label===this.props.parentNodeLabel );
      // We don't know what target the user is going to pick yet, so just display a
      // placeholder for now, otherwise, the render will choke on an invalid targetNode.
      targetNodes = [{label:'pick one...'}];
      // set this autoComplete field as current
      UDATA.Call('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'target', searchString:''});
      // Define `edge` so it can be loaded later during setState.
      edge = {
        id: edgeID,
        source: sourceNodes[0].id,  // REVIEW: d3data 'source' is id, rename this to 'sourceId'?
                                    // though after d3 processes, source does become an object.
        target: undefined,
        attributes: {
          Relationship: '',
          Citations: '',
          Notes: ''
        }
      }
      // Expand this EdgeEditor and set it to Edit mode.
      this.setState({
        isExpanded:           true,
        isEditable:           true,
      });

    } else {

      // LOAD EXISTING EDGE

      sourceNodes = D3DATA.nodes.filter( node => node.id===edge.source.id );
      targetNodes = D3DATA.nodes.filter( node => node.id===edge.target.id );

    }

    if (!sourceNodes) {
      throw 'EdgeEditor: Source ID',edge.source,'not found!';
      return;
    }
    sourceNode = sourceNodes[0];
    if (!targetNodes) {
      throw 'EdgeEditor: Target ID',edge.target,'not found!';
      return;
    }
    targetNode = targetNodes[0];

    if (DBG) console.log('...EdgeEditor.loadSourceAndTarget: Setting formData sourceID to',edge.source,'and sourceNode to',sourceNode);
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
    })
  }

  onRelationshipChange (event) {
    let formData = this.state.formData;
    formData.relationship = event.target.value;
    this.setState({formData: formData});
  }
  onInfoChange (event) {
    let formData = this.state.formData;
    formData.info = event.target.value;
    this.setState({formData: formData});
  }
  onNotesChange (event) {
    let formData = this.state.formData;
    formData.notes = event.target.value;
    this.setState({formData: formData});
  }
  onSubmit ( event ) {
    event.preventDefault()

    let formData = this.state.formData

    // Read current edge values
    // This is necessary because the SOURCE and TARGET labels
    // are bound to selectedSourceNode and selectedTargetNode, not selectedEdge
    let edge = {
      id:             formData.id,
      source:         this.state.sourceNode.id,   // REVIEW: d3data 'source' is id, rename this to 'sourceId'?
                                                  // though after d3 processes, source does become an object.
      target:         this.state.targetNode.id,   // REVIEW: d3data 'target' is id, rename this to 'targetId'?
      attributes: {
        Relationship: formData.relationship,
        Citations:    formData.info,
        Notes:        formData.notes
      }
    }

    if (DBG) console.group('EdgeEntry.onSubmit submitting',edge)

    // Notify parent of new edge data
    UDATA.Call('EDGE_UPDATE',{edge:edge});

    // Notify parent to deselect selectedNode
    UDATA.Call('SOURCE_SELECT',{nodeLabels:[]});

    // Clear the any selections
    this.clearForm()

  }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// REACT LIFECYCLE
  ///

  // componentWillReceiveProps has been deprectaed by React.  Don't use!
  // componentWillReceiveProps (nextProps) {
  // }

  // This is not yet implemented as of React 16.2.  It's implemented in 16.3.
  getDerivedStateFromProps (props, state) {
    console.error('getDerivedStateFromProps!!!');
  }

  render () {
    const { edgeID, parentNodeLabel } = this.props;
    const { formData, sourceNode, targetNode } = this.state;
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
                onSubmit={this.onSubmit}>
            <FormText>EDGE</FormText>
            <FormGroup>
              <Label for="source" className="small text-muted">SOURCE</Label>
              <AutoComplete
                identifier={'edge'+edgeID+'source'}
                disabledValue={sourceNode.label}
                inactiveMode={parentNodeLabel===sourceNode.label ? 'static' : 'disabled'}
              />
            </FormGroup>
            <FormGroup>
              <Label for="relationship" className="small text-muted">TYPE</Label>
              <Input type="select" name="relationship" id="relationship"
                value={formData.relationship}
                onChange={this.onRelationshipChange}
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
              <Label for="nodeLabel" className="small text-muted">TARGET</Label>
              <AutoComplete
                identifier={'edge'+edgeID+'target'}
                disabledValue={targetNode.label}
                inactiveMode={parentNodeLabel===targetNode.label ? 'static' : 'disabled'}
              />
            </FormGroup>
            <FormGroup>
              <Label for="notes" className="small text-muted">NOTES</Label>
              <Input type="text" name="notes" id="notes"
                value={formData.notes}
                onChange={this.onNotesChange}
                readOnly={!this.state.isEditable}
              />
            </FormGroup>
            <FormGroup>
              <Label for="info" className="small text-muted">APPROXIMATE DATE OF INTERACTION</Label>
              <Input type="text" name="info" id="info"
                value={formData.info}
                onChange={this.onInfoChange}
                readOnly={!this.state.isEditable}
              />
            </FormGroup>
            <FormGroup>
              <Label sm={2} className="small text-muted">ID: {formData.id}</Label>
            </FormGroup>
            <FormGroup className="text-right" style={{paddingRight:'5px'}}>
              <Button className="small text-muted float-left btn btn-outline-light" size="sm"
               onClick={this.onDeleteButtonClick}
              >DELETE</Button>&nbsp;
              <Button outline size="sm"
                hidden={this.state.isEditable}
                onClick={this.onEditButtonClick}
              >{this.state.isEditable?"Add New Edge":"Edit Edge"}</Button>&nbsp;
              <Button size="sm"
                onClick={this.onButtonClick}
                hidden={this.state.isEditable}
              >Done</Button>&nbsp;
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

  // This is the proper call to use.  This should survive past React 16.3.
  componentDidMount () {
    if (DBG) console.log('EdgeEditor.componentDidMount!');
    this.loadSourceAndTarget();
  }

  // Deprecated in 16.3.  Don't use.
  // componentWillUpdate (nextProps) {
  //   console.error('EdgeEditor.componentWillUpdate!!')
  // }


}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeEditor;
