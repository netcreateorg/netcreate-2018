/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

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


  ## TO USE

    EdgeEditors are usually included as a repeating element, e.g.

      <FormText>EDGES</FormText>
      {this.state.edges.map( (edge,i) =>
        <EdgeEditor key={i}
          edgeID={edge.id}
          parentNodeLabel={this.state.formData.label}
        />
      )}


  ## PROPS

    edgeID            edgeID provides a unique identifier for the EdgeEditor
                      displaying the particular edge.  The edgeID is
                      used to also uniquely identify the AutoComplete
                      fields within the EdgeEditor.

    parentNodeLabel   parentNodeLabel is the label of the source node that
                      the EdgeEditor is displayed within.  This is used
                      by the EdgeEditor to determine whether it should
                      display the edge nodes as targets or sources.

  ## STATES

      dbIsLocked
                      If someone else has selected the edge for editing,
                      this flag will cause the dbIsLockedMessage
                      to be displayed.  This is only checked when
                      the user clicks "Edit".


  ## TECHNICAL DESCRIPTION


  ## TESTING


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
              * The "NOTES" and "DATE" fields will become editable.
        4. Click "Save"
        5. Select the updated edge.
              * The changed notes and dates should appear.

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
        2. Click on "me -> Residents of Chinatown"
        3. Click on "DELETE"
              * The edge should be removed.
              * The graph should update with the edge remvoed.
              * The EdgeEditor for the deleted edge shoudl close.
              * The source node should remain selected.
              * The non-deleted edges should still be listed.

    Swap
        1. Select an edge where the node is the source (the edge should read "this -> OtherNode".
        2. Click "Edit Edge"
              * You should see a swap button with up/down arrows and a "Change Target" button.
        3. Click on the swap button
              * The selected node should now be the target.
        4. Click "Save" to save the change.
        5. Review the node to make sure the change took place.
        6. Reload the graph to make sure the change was saved.

    Change Target
        1. Select an edge where the node is the source (the edge should read "this -> OtherNode".
        2. Click "Edit Edge"
              * You should see a swap button with up/down arrows and a "Change Target" button.
        3. Click on the "Change Target" button
              * You should be able to search for another target node, or click on the graph to select a target node.
        4. When you've selected a target node, the Target Node field should become disabled (light blue, can't type in it).
        5. Click on "Change Target" again to pick a different target.
        6. Click "Save" to save the change.
        7. Review the node to make sure the change took place.
        8. Reload the graph to make sure the change was saved.

    Change Source
        1. Select an edge where the node is the source (the edge should read "this -> OtherNode".
        2. Click "Edit Edge"
              * You should see a "Change Source" button next to the source, and just the swap button next to the target.
        3. Click on the "Change Source" button
        4. You should be able to search for another source node, or click on the graph to select a source node.
        5. When you've selected a source node, the Source Node field should become disabled (light blue, can't type in it).
        6. Click on "Change Source" again to pick a different source.
        7. Click "Save" to save the change.
        8. Review the node to make sure the change took place.
        9. Reload the graph to make sure the change was saved.

    Save
        * The "Save" button should only be visible when the edge is being edited
        * The "Save" button should only be enabled if both the Source and Target
          fields point to valid nodes.
        * Otherwise, the "Save" button should be disabled.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;
const PR  = "EdgeEditor";

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Col, Form, FormGroup, FormText, Input, Label } = ReactStrap;
const AutoComplete = require('./AutoComplete');
const NodeDetail   = require('./NodeDetail');

const UNISYS   = require('unisys/client');
var   UDATA    = null;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class EdgeEditor extends UNISYS.Component {
    constructor (props) {
      super(props);
      this.state = {
        edgePrompts:    this.AppState('TEMPLATE').edgePrompts,
        formData: {                 // Holds the state of the form fields
          sourceId:     '',
          targetId:     '',
          relationship: '',
          info:         '',
          notes:        '',
          citation:     '',
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
        isLocked:        true,       // User has not logged in, don't allow edge edit
        dbIsLocked:      false,      // Server Database is locked because someone else is editing
        isEditable:      false,      // Form is in an edtiable state
        isExpanded:      false,      // Show EdgeEditor Component in Summary view vs Expanded view
        sourceIsEditable:false,      // Source ndoe field is only editable when source is not parent
        hasValidSource:  false,      // Used by SwapSourceAndTarget and the Change Source button
        targetIsEditable:false,      // Target ndoe field is only editable when target is not parent
        hasValidTarget:  false       // Used by SwapSourceAndTarget and the Change Target button
      };

      /// Initialize UNISYS DATA LINK for REACT
      UDATA = UNISYS.NewDataLink(this);

      this.handleSelection        = this.handleSelection.bind(this);
      this.handleEdgeSelection    = this.handleEdgeSelection.bind(this);
      this.handleEdgeEdit         = this.handleEdgeEdit.bind(this);
      this.onStateChange_SESSION  = this.onStateChange_SESSION.bind(this);
      this.onButtonClick          = this.onButtonClick.bind(this);
      this.onDeleteButtonClick    = this.onDeleteButtonClick.bind(this);
      this.onEditButtonClick      = this.onEditButtonClick.bind(this);
      this.requestEdit = this.requestEdit.bind(this);
      this.onSwapSourceAndTarget  = this.onSwapSourceAndTarget.bind(this);
      this.onChangeSource         = this.onChangeSource.bind(this);
      this.onChangeTarget         = this.onChangeTarget.bind(this);
      this.onRelationshipChange   = this.onRelationshipChange.bind(this);
      this.onNotesChange          = this.onNotesChange.bind(this);
      this.onInfoChange           = this.onInfoChange.bind(this);
      this.onCitationChange       = this.onCitationChange.bind(this);
      this.onSubmit               = this.onSubmit.bind(this);

      // Always make sure class methods are bind()'d before using them
      // as a handler, otherwise object context is lost

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ SESSION is called by SessionShell when the ID changes
      set system-wide. data: { classId, projId, hashedId, groupId, isValid }
  /*/ this.OnAppStateChange('SESSION',this.onStateChange_SESSION);
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      this.OnAppStateChange('SELECTION',(data) => {
        this.handleSelection(data);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      UDATA.HandleMessage('EDGE_SELECT',(data) => {
        this.handleEdgeSelection(data);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      UDATA.HandleMessage('EDGE_EDIT',(data) => {
        this.handleEdgeEdit(data);
      });

      // Template handler
      this.OnAppStateChange('TEMPLATE',(data) => {
        this.setState({edgePrompts: data.edgePrompts});
      });

    } // constructor


/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ clearForm () {
      this.setState({
        formData: {
          sourceId:     '',
          targetId:     '',
          relationship: '',
          info:         '',
          notes:        '',
          citation:     '',
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
        isExpanded:           false,      // Summary view vs Expanded view
        dbIsLocked:           false,
        sourceIsEditable:     false,      // Source ndoe field is only editable when source is not parent
        hasValidSource:       false,      // Used by SwapSourceAndTarget and the Change Source button
        targetIsEditable:     false,      // Target ndoe field is only editable when target is not parent
        hasValidTarget:       false       // Used by SwapSourceAndTarget and the Change Target button
      });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ populate formdata from D3DATA
/*/ loadSourceAndTarget () {
      if (DBG) console.log('EdgeEditor.loadSourceAndTarget!')

      let edgeID = this.props.edgeID || '';
      // Clean Data
      if (isNaN(edgeID)) { edgeID = parseInt(edgeID); }

      let D3DATA = this.AppState('D3DATA');

      // parseInt in case of old bad string id
      let edges = D3DATA.edges.filter( edge=>parseInt(edge.id)===edgeID );
      if (!edges) {
        throw 'EdgeEditor: Passed edgeID'+edgeID+'not found!';
      }
      let edge = edges[0];
      if (DBG) console.log('EdgeEditor.loadSourceAndTarget: Loading edge', edge);

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
        this.AppCall('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'target'});
        // Define `edge` so it can be loaded later during setState.
        edge = {
          id: edgeID,
          source: parseInt(sourceNodes[0].id),  // REVIEW: d3data 'source' is id, rename this to 'sourceId'?
                                      // though after d3 processes, source does become an object.
          target: undefined,
          attributes: {
            Relationship: '',
            Info: '',
            Citations: '',
            Notes: ''
          }
        }
        // Expand this EdgeEditor and set it to Edit mode.
        this.setState({
          isExpanded:           true,
          targetIsEditable:     true,
          isEditable:           true
        });

        this.AppCall('EDGEEDIT_LOCK', { edgeID: this.props.edgeID });

      } else {

        // LOAD EXISTING EDGE

        sourceNodes = D3DATA.nodes.filter( node => parseInt(node.id)===parseInt(edge.source.id) );
        targetNodes = D3DATA.nodes.filter( node => parseInt(node.id)===parseInt(edge.target.id) );

        // Assume we have a valid target node
        this.setState({
          hasValidSource:       true,
          hasValidTarget:       true
        });

      }

      if (!sourceNodes) {
        throw 'EdgeEditor: Source ID'+edge.source+'not found!';
      }
      sourceNode = sourceNodes[0];
      if (!targetNodes) {
        throw 'EdgeEditor: Target ID'+edge.target+'not found!';
      }
      targetNode = targetNodes[0];

      if (DBG) console.log('...EdgeEditor.loadSourceAndTarget: Setting formData sourceID to',edge.source,'and sourceNode to',sourceNode,'and targetNode to',targetNode);
      this.setState({
        formData: {
          id:           parseInt(edge.id) || '',
          sourceId:     edge.source,
          targetId:     edge.target,
          relationship: edge.attributes["Relationship"] || '',   // Make sure there's valid data
          info:         edge.attributes["Info"] || '',
          citation:     edge.attributes["Citations"] || '',
          notes:        edge.attributes["Notes"] || '',
          isNewEdge:    false
        },
        sourceNode: sourceNode,
        targetNode: targetNode,
        dbIsLocked: false
      })
    }



/// UDATA STATE HANDLERS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ When the user is creating a new node, they need to set a target node.
    The target node is set via an AutoComplete field.
    When a node is selected via the AutoComplete field, the SELECTION state is updated.
    So EdgeEditor needs to listen to the SELECTION state in order to
    know the target node has been selected.
    SELECTION is also triggered when the network updates an edge.
/*/ handleSelection ( data ) {
      if (DBG) console.log('EdgeEditor',this.props.edgeID,'got SELECTION data',data);


      // If we're one of the edges that have been updated, and we're not currently being edited,
      // then update the data.
      // If we're not currently being edited, then if edges have been updated, update self
      let updatedEdge = data.edges.find((edge) => { return edge.id === this.state.formData.id; });
      if (!this.state.isEditable && updatedEdge!==undefined) {
        if (DBG) console.log('EdgeEditor: Updating edges with', updatedEdge);
        this.loadSourceAndTarget();
        return;
      }

      // Technically we probably ought to also check to make sure we're the current
      // activeAutoCompleteId, but we wouldn't be editable if we weren't.
      if (this.state.isEditable && data.nodes && data.nodes.length > 0) {
        // A node was selected, so load it

          let node = data.nodes[0];

        // Are we editing the source or the target?
        if (this.state.sourceIsEditable) {
          // SOURCE
          if (DBG) console.log('EdgeEditor.handleSelection:',this.props.edgeID,'setting source node to',node);

          // Set sourceNode state
          this.setState({
            sourceNode: node
          });
          // Also update the formdata
          let formData = this.state.formData;
          formData.sourceId = node.id;
          this.setState({
            formData: formData
          });
          // And let the switch button know we have a valid target
          // And exit edit mode
          this.setState({
            hasValidSource:   true,
            sourceIsEditable: false
          });

        } else if (this.state.targetIsEditable) {
          // TARGET
          if (DBG) console.log('EdgeEditor.handleSelection:',this.props.edgeID,'setting target node to',node);

          // Set targetNode state
          this.setState({
            targetNode: node
          });
          // Also update the formdata
          let formData = this.state.formData;
          formData.targetId = node.id;
          this.setState({
            formData: formData
          });
          // And let the switch button know we have a valid target
          // And exit edit mode
          this.setState({
            hasValidTarget:   true,
            targetIsEditable: false
          });

        }
        // pass currentAutoComplete back to search
        this.AppCall('AUTOCOMPLETE_SELECT',{id:'search'});
        this.setState({ isExpanded: true });
      } else {
        // No node selected, so we don't need to do anything
        // AutoComplete will take care of its own search label updates
      }

    } // handleSelection
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Someone externally has selected an edge.
    Usually someone has clicked a button in the EdgeList to view/edit an edge
/*/ handleEdgeSelection ( data ) {
      if (DBG) console.log('EdgeEditor',this.props.edgeID,': got state EDGE_SELECT',data);

      if (this.state.formData.id === data.edgeID) {
        // pass currentAutoComplete back to search
        this.AppCall('AUTOCOMPLETE_SELECT',{id:'search'});
        this.setState({ isExpanded: true });
      }

    } // handleEdgeSelection

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Someone externally has selected an edge for editing.
    Usually someone has clicked a button in the EdgeTable to edit an edge
/*/ handleEdgeEdit ( data ) {
      if (DBG) console.log('EdgeEditor',this.state.formData.id,': got state EDGE_EDIT',data,'formData is',this.state.formData);

      if (this.state.formData.id === data.edgeID) {
        this.requestEdit();
      }

    } // handleEdgeEdit
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle change in SESSION data
    Called both by componentDidMount() and AppStateChange handler.
    The 'SESSION' state change is triggered in two places in SessionShell during
    its handleChange() when active typing is occuring, and also during
    SessionShell.componentWillMount()
/*/ onStateChange_SESSION( decoded ) {
      let update = { isLocked:   !decoded.isValid };
      this.setState(update);
    }


/// UI EVENT HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Expand if the edge is collapsed.
    Cancel editing if the edge is expanded.
/*/ onButtonClick () {
      // REVIEW: Rename Cancel or Expand?
      // Cancel/Close
      if (this.state.isExpanded) {
        // collapse
        this.setState({ isExpanded: false });

        // If we were editing, then revert and exit
        if (this.state.isEditable) {
          this.loadSourceAndTarget();
          this.setState({ isEditable: false, targetIsEditable: false });
          this.AppCall('EDGEEDIT_UNLOCK', { edgeID: this.props.edgeID });
          this.AppCall('AUTOCOMPLETE_SELECT',{id:'search'});
          // unlock
          this.NetCall('SRV_DBUNLOCKEDGE', { edgeID: this.state.formData.id })
            .then((data) => {
              if (data.NOP) {
                if (DBG) console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
              } else if (data.unlocked) {
                if (DBG) console.log(`SERVER SAYS: unlock success! you have released Edge ${data.edgeID}`);
                this.setState({ dbIsLocked: false });
              }
            });
        }
      } else {
        // expand, but don't set the autocomplete field, since we're not editing
        this.setState({ isExpanded: true });
      }
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onDeleteButtonClick () {
      this.clearForm();
      this.AppCall('EDGEEDIT_UNLOCK', { edgeID: this.props.edgeID }); // inform NodeSelector
      this.AppCall('DB_UPDATE',{edgeID:this.props.edgeID});
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onEditButtonClick () {
      this.requestEdit(this.state.formData.id);

      // Don't allow editing of the source or target fields.
      // If you want to change the edge, delete this one and create a new one.
      // if (this.props.parentNodeLabel===this.state.sourceNode.label) {
      //   // The source node is the currently selected node in NodeSelector.  Edit the target.
      //   UDATA.LocalCall('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'target', searchString: this.state.targetNode.label});
      // } else {
      //   // The NodeSelector node is the target.  Allow editing the source.
      //   UDATA.LocalCall('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'source', searchString: this.state.sourceNode.label});
      // }
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ requestEdit() {
      let edgeID = this.state.formData.id;
      if (edgeID && edgeID!=='' && !isNaN(edgeID) && (typeof edgeID ==="number")) {
        this.NetCall('SRV_DBLOCKEDGE', { edgeID: edgeID })
          .then((data) => {
            if (data.NOP) {
              // Edge is locked, can't edit
              if (DBG) console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
              this.setState({ dbIsLocked: true });
            } else if (data.locked) {
              if (DBG) console.log(`SERVER SAYS: lock success! you can edit Edge ${data.edgeID}`);
              if (DBG) console.log(`SERVER SAYS: unlock the edge after successful DBUPDATE`);
              this.setState({
                isEditable: true,
                isExpanded: true,
                dbIsLocked: false
              });
              this.AppCall('EDGEEDIT_LOCK', { edgeID: this.props.edgeID }); // inform NodeSelector
            }
          });
      }
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onSwapSourceAndTarget () {
      let formData = this.state.formData;

      // swap formadata
      let targetId = formData.targetId;
      formData.targetId = formData.sourceId;
      formData.sourceId = targetId;

      // swap this.state.source and target
      let swap   = this.state.sourceNode;
      let source = this.state.targetNode;
      let target = swap;

      // REVIEW
      // Get rid of separate this.state.source and this.state.target
      // and just use formData?!?

      this.setState({
        formData: formData,
        sourceNode: source,
        targetNode: target
      });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onChangeSource () {
      this.setState({
        sourceIsEditable: true,
        hasValidSource: false
      });
      this.AppCall('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'source'});
      // Whenever we set the autocomplete to source, we have to update the label
      this.AppCall('SOURCE_SEARCH', { searchString: this.state.sourceNode.label });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onChangeTarget () {
      this.setState({
        targetIsEditable: true,
        hasValidTarget: false
      });
      this.AppCall('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'target'});
      // Whenever we set the autocomplete to target, we have to update the label
      this.AppCall('SOURCE_SEARCH', { searchString: this.state.targetNode.label });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onRelationshipChange (event) {
      let formData = this.state.formData;
      formData.relationship = event.target.value;
      this.setState({formData: formData});
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onInfoChange (event) {
      let formData = this.state.formData;
      formData.info = event.target.value;
      this.setState({formData: formData});
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onCitationChange (event) {
      let formData = this.state.formData;
      formData.citation = event.target.value;
      this.setState({formData: formData});
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onNotesChange (event) {
      let formData = this.state.formData;
      formData.notes = event.target.value;
      this.setState({formData: formData});
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onSubmit ( event ) {
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
          Info:         formData.info,
          Citations:    formData.citation,
          Notes:        formData.notes
        }
      }
      if (DBG) console.group('EdgeEntry.onSubmit submitting',edge)

      this.AppCall('EDGEEDIT_UNLOCK', { edgeID: this.props.edgeID }); // inform NodeSelector
      // pass currentAutoComplete back to nodeselector
      this.AppCall('AUTOCOMPLETE_SELECT',{id:'search'});
      this.setState({ isEditable: false, sourceIsEditable: false, targetIsEditable: false });
      this.AppCall('DB_UPDATE', { edge })
        .then(() => {
          this.NetCall('SRV_DBUNLOCKEDGE', { edgeID: edge.id })
            .then((data) => {
              if (data.NOP) {
                if (DBG) console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
              } else if (data.unlocked) {
                if (DBG) console.log(`SERVER SAYS: unlock success! you have released Edge ${data.edgeID}`);
                this.setState({ dbIsLocked: false });
              }
            });
        });

  } // onSubmit



/// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This is not yet implemented as of React 16.2.  It's implemented in 16.3.
    getDerivedStateFromProps (props, state) {
      console.error('getDerivedStateFromProps!!!');
    }
/*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ render () {
      const { edgeID, parentNodeLabel } = this.props;
      const { formData, sourceNode, targetNode, edgePrompts } = this.state;
      const me = <span style={{color:"rgba(0,0,0,0.2)",fontStyle:"italic"}}>this node</span>;
      return (
        <div>

          <Button
            className={this.state.isExpanded?'d-none':''}
            outline
            size="sm"
            style={{backgroundColor:"#a9d3ff",borderColor:'transparent',width:'100%',marginBottom:'3px',textAlign:"left"}}
            onClick={this.onButtonClick}
          >{parentNodeLabel===sourceNode.label ? me : sourceNode.label}
          &nbsp;&#x2794;&nbsp;
          {parentNodeLabel===targetNode.label ? me : targetNode.label}</Button>

          <div className={this.state.isExpanded?'':'d-none'}>
            <Form className="nodeEntry"
                  style={{backgroundColor:"#C9E1FF",minHeight:'300px',padding:'5px',marginBottom:'10px'}}
                  onSubmit={this.onSubmit}>
              <FormText><b>EDGE {formData.id}</b></FormText>
              <FormGroup row>
                <Col sm={3}>
                  <Label for="source" className="small text-muted">Source</Label>
                </Col>
                <Col sm={9}>
                  <AutoComplete
                    identifier={'edge'+edgeID+'source'}
                    disabledValue={sourceNode.label}
                    inactiveMode={parentNodeLabel===sourceNode.label ? 'static' : 'disabled'}
                    shouldIgnoreSelection={!this.state.sourceIsEditable}
                  />
                  <Button outline size="sm" className="float-right"
                    hidden={ !(this.state.isEditable &&
                               this.state.hasValidSource &&
                               (sourceNode.label!==this.props.parentNodeLabel)) }
                    onClick={this.onChangeSource}
                    title="Select a different source node"
                  >Change Source</Button>
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgePrompts.type.hidden}>
                <Col sm={3}>
                  <Label for="relationship" className="small text-muted">Type</Label>
                </Col>
                <Col sm={9}>
                  <Input type="select" name="relationship" id="relationship"
                    value={formData.relationship}
                    onChange={this.onRelationshipChange}
                    disabled={!this.state.isEditable}
                    >
                    {edgePrompts.type.options.map( (option,i) => (
                      <option id={option.id} key={option.id}>{option.label}</option>
                    ))}
                  </Input>
                </Col>
              </FormGroup>
              <FormGroup row>
                <Col sm={3}>
                  <Label for="nodeLabel" className="small text-muted">Target</Label>
                </Col>
                <Col sm={9}>
                  <AutoComplete
                    identifier={'edge'+edgeID+'target'}
                    disabledValue={targetNode.label}
                    inactiveMode={parentNodeLabel===targetNode.label ? 'static' : 'disabled'}
                    shouldIgnoreSelection={!this.state.targetIsEditable}
                  />
                  <Button outline size="sm" className="float-right"
                    hidden={ !(this.state.isEditable &&
                               this.state.hasValidTarget &&
                               (targetNode.label!==this.props.parentNodeLabel)) }
                    onClick={this.onChangeTarget}
                    title="Select a different target node"
                  >Change Target</Button>
                  <Button outline size="sm" className="float-right" style={{marginRight:'5px'}}
                    hidden={!(this.state.isEditable && this.state.hasValidTarget)}
                    onClick={this.onSwapSourceAndTarget}
                    title="Swap 'Source' and 'Target' nodes"
                  >&uarr;&darr;</Button>
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgePrompts.citation.hidden}>
                <Col sm={3}>
                  <Label for="citation" className="small text-muted">{edgePrompts.citation.label}</Label>
                </Col>
                <Col sm={9}>
                  <Input type="text" name="citation" id="citation"
                    value={formData.citation}
                    onChange={this.onCitationChange}
                    readOnly={!this.state.isEditable}
                  />
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgePrompts.notes.hidden}>
                <Col sm={3}>
                  <Label for="notes" className="small text-muted">{edgePrompts.notes.label}</Label>
                </Col>
                <Col sm={9}>
                  <Input type="textarea" name="notes" id="notes"
                    value={formData.notes}
                    onChange={this.onNotesChange}
                    readOnly={!this.state.isEditable}
                  />
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgePrompts.info.hidden}>
                <Col sm={3}>
                  <Label for="info" className="small text-muted">{edgePrompts.info.label}</Label>
                </Col>
                <Col sm={9}>
                  <Input type="text" name="info" id="info"
                    value={formData.info}
                    onChange={this.onInfoChange}
                    readOnly={!this.state.isEditable}
                  />
                </Col>
              </FormGroup>
              <FormGroup className="text-right" style={{paddingRight:'5px'}}>
                <Button className="small text-muted float-left btn btn-outline-light" size="sm"
                 hidden={this.state.isLocked}
                 onClick={this.onDeleteButtonClick}
                >Delete</Button>&nbsp;
                <Button outline size="sm"
                  hidden={this.state.isLocked || this.state.isEditable}
                  onClick={this.onEditButtonClick}
                >{this.state.isEditable ? "Add New Edge" : "Edit Edge"}</Button>&nbsp;
                <Button size="sm"
                  outline={this.state.isEditable}
                  onClick={this.onButtonClick}
                >{this.state.isEditable?'Cancel':'Close'}</Button>&nbsp;
                <Button color="primary" size="sm"
                  hidden={!this.state.isEditable}
                  disabled={ !(this.state.isEditable && this.state.hasValidTarget) }
                >Save</Button>
                <p hidden={!this.state.dbIsLocked} className="small text-danger">{edgePrompts.edgeIsLockedMessage}</p>
              </FormGroup>
            </Form>
          </div>

        </div>
      );
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentDidMount () {
      if (DBG) console.log('EdgeEditor.componentDidMount!');
      this.loadSourceAndTarget();
      this.onStateChange_SESSION(this.AppState('SESSION'));
    }
} // class EdgeEditor


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeEditor;
