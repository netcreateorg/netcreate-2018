/* eslint-disable complexity */
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

    parentNodeIsLocked The parent node is locked when the server disconnects
                       this will disable the Delete and Edit buttons.

  ## STATES

      dbIsLocked
                      If someone else has selected the edge for editing,
                      this flag will cause the dbIsLockedMessage
                      to be displayed.  This is only checked when
                      the user clicks "Edit".

      disableEdit     Template is being edited, disable "Edit Edge" button

      isBeingEdited   The form fields are active and text can be changed.


  ## TECHNICAL DESCRIPTION

    EdgeEditor works directly with raw NCDATA, unprocessed by d3.
    This means that `edge.source` and `edge.target` are IDs, NOT the node objects
    that d3 will convert them into.


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

import { mdReact } from 'markdown-react-js';
const mdplugins = {
  emoji: require('markdown-it-emoji')
};

const DBG = false;
const PR  = "EdgeEditor";

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Col, Form, FormGroup, FormText, Input, Label } = ReactStrap;
const AutoComplete = require('./AutoComplete');
const NodeDetail   = require('./NodeDetail');

const UNISYS   = require('unisys/client');
const { EDITORTYPE } = require("system/util/enum");
var   UDATA    = null;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class EdgeEditor extends UNISYS.Component {
    constructor (props) {
      super(props);
      const TEMPLATE = this.AppState('TEMPLATE');
      this.state = {
        edgeDefs: TEMPLATE.edgeDefs,
        citation: TEMPLATE.citation,
        edgeIsLockedMessage: TEMPLATE.edgeIsLockedMessage,
        editLockMessage: '',
        formData: {                 // Holds the state of the form fields
          sourceId:     '',
          targetId:     '',
          type: '',
          info:         '',
          provenance: '',
          comments: '',
          notes:        '',
          citation:     '',
          category:     '',
          id:           '',
          isNewEdge:    true
        },
        sourceNode: {               // Holds the current selected source node
            label:     '',
            type:      '',
            info:      '',
            provenance: '',
            comments: '',
            notes:     '',
            id:        ''
        },
        targetNode: {               // Holds the current selected target node
            label:     '',
            type:      '',
            info:      '',
            provenance: '',
            comments: '',
            notes:     '',
            id:        ''
        },
        isLocked:        true,       // User has not logged in, don't allow edge edit
        isStandalone: false,         // Standalone mode, view only
        dbIsLocked:      false,      // Server Database is locked because someone else is editing
        disableEdit: false,          // Template is being edited, disable "Edit Edge" button
        isBeingEdited: false,        // Form is in an editable state
        isExpanded:      false,      // Show EdgeEditor Component in Summary view vs Expanded view
        sourceIsEditable:false,      // Source ndoe field is only editable when source is not parent
        hasValidSource:  false,      // Used by SwapSourceAndTarget and the Change Source button
        targetIsEditable:false,      // Target ndoe field is only editable when target is not parent
        hasValidTarget:  false,      // Used by SwapSourceAndTarget and the Change Target button
        placeholder:     undefined,
        hideModal: true              // used by the citation window
      };

      /// Initialize UNISYS DATA LINK for REACT
      UDATA = UNISYS.NewDataLink(this);

      this.setTemplate = this.setTemplate.bind(this);
      this.updateEditState = this.updateEditState.bind(this);
      this.setEditState = this.setEditState.bind(this);
      this.handleSelection        = this.handleSelection.bind(this);
      this.handleEdgeSelection    = this.handleEdgeSelection.bind(this);
      this.handleEdgeEdit         = this.handleEdgeEdit.bind(this);
      this.handleEdgeClose = this.handleEdgeClose.bind(this);
      this.onStateChange_SESSION  = this.onStateChange_SESSION.bind(this);
      this.onEdgeClick            = this.onEdgeClick.bind(this);
      this.onDeleteButtonClick    = this.onDeleteButtonClick.bind(this);
      this.onEditButtonClick      = this.onEditButtonClick.bind(this);
      this.onCiteButtonClick      = this.onCiteButtonClick.bind(this);
      this.onCloseCiteClick       = this.onCloseCiteClick.bind(this);
      this.dateFormatted          = this.dateFormatted.bind(this);
      this.requestEdit            = this.requestEdit.bind(this);
      this.onSwapSourceAndTarget  = this.onSwapSourceAndTarget.bind(this);
      this.onChangeSource         = this.onChangeSource.bind(this);
      this.onChangeTarget         = this.onChangeTarget.bind(this);
      this.onRelationshipChange   = this.onRelationshipChange.bind(this);
      this.onNotesChange          = this.onNotesChange.bind(this);
      this.onInfoChange           = this.onInfoChange.bind(this);
      this.onProvenanceChange = this.onProvenanceChange.bind(this);
      this.onCommentsChange = this.onCommentsChange.bind(this);
      this.onCitationChange       = this.onCitationChange.bind(this);
      this.onCategoryChange       = this.onCategoryChange.bind(this);
      this.onSubmit               = this.onSubmit.bind(this);
      this.checkUnload            = this.checkUnload.bind(this);
      this.doUnload               = this.doUnload.bind(this);

      // Always make sure class methods are bind()'d before using them
      // as a handler, otherwise object context is lost

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ SESSION is called by SessionShell when the ID changes
      set system-wide. data: { classId, projId, hashedId, groupId, isValid }
  /*/ this.OnAppStateChange('SESSION', this.onStateChange_SESSION);
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      this.OnAppStateChange('SELECTION', this.handleSelection);
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      UDATA.HandleMessage('EDGE_SELECT', this.handleEdgeSelection);
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      UDATA.HandleMessage('EDGE_EDIT', this.handleEdgeEdit);
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      UDATA.HandleMessage('EDGE_CLOSE', this.handleEdgeClose);
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // Template handlers
      this.OnAppStateChange('TEMPLATE', this.setTemplate);
      UDATA.HandleMessage('EDIT_PERMISSIONS_UPDATE', this.setEditState);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Prevent editing if server is disconnected.
      This is necessary to hide the "Add New Node" button.
  /*/
      this.OnDisconnect(() => {
        console.log('EdgeSelector got disconnect')
        this.setState({ isLocked: true });
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
          type: '',
          info:         '',
          provenance: '',
          comments: '',
          notes:        '',
          citation:     '',
          category:     '',
          id:           '',
          isNewEdge:    true
        },
        sourceNode: {
            label:     '',
            type:      '',
            info:      '',
            provenance: '',
            comments: '',
            notes:     '',
            id:        ''
        },
        targetNode: {
            label:     '',
            type:      '',
            info:      '',
            provenance: '',
            comments: '',
            notes:     '',
            id:        ''
        },
        isBeingEdited:        false,
        isExpanded:           false,      // Summary view vs Expanded view
        dbIsLocked:           false,
        sourceIsEditable:     false,      // Source ndoe field is only editable when source is not parent
        hasValidSource:       false,      // Used by SwapSourceAndTarget and the Change Source button
        targetIsEditable:     false,      // Target ndoe field is only editable when target is not parent
        hasValidTarget:       false,      // Used by SwapSourceAndTarget and the Change Target button
        hideModal: true                   // for the citation window

      });
  }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    setTemplate(data) {
      this.setState({ edgeDefs: data.edgeDefs });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Disable Edge Edit if a Template is being edited
/*/
    updateEditState() {
      UDATA.NetCall("SRV_GET_EDIT_STATUS")
        .then(data => {
          this.setEditState(data);
        });
    }
    setEditState(data) {
      if (DBG) console.log(PR, 'SRV_GET_EDIT_STATUS received', data)
      const disableEdit = data.templateBeingEdited || data.importActive;
      const TEMPLATE = this.AppState('TEMPLATE');
      let editLockMessage = '';
      if (data.templateBeingEdited) editLockMessage = TEMPLATE.templateIsLockedMessage;
      if (data.importActive) editLockMessage = TEMPLATE.importIsLockedMessage;
      this.setState({ disableEdit, editLockMessage });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ populate formdata from NCDATA
/*/ loadSourceAndTarget () {
      if (DBG) console.log('EdgeEditor.loadSourceAndTarget!')

      let edgeID = this.props.edgeID || '';
      // Clean Data
      if (isNaN(edgeID)) { edgeID = parseInt(edgeID); }

      const NCDATA = this.AppState('NCDATA');

      // parseInt in case of old bad string id
      let edges = NCDATA.edges ? NCDATA.edges.filter( edge=>parseInt(edge.id)===edgeID ) : [];
      if (!edges) {
        throw 'EdgeEditor: Passed edgeID '+edgeID+' not found!';
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
        sourceNodes = NCDATA.nodes.filter( node => node.label===this.props.parentNodeLabel );
        // We don't know what target the user is going to pick yet, so just display a
        // placeholder for now, otherwise, the render will choke on an invalid targetNode.
        targetNodes = [{label:'pick one...'}];

        // provenance
        const session = this.AppState("SESSION");
        const timestamp = new Date().toLocaleDateString('en-US');
        const provenance_str = `Added by ${session.token} on ${timestamp}`;

      // Define `edge` so it can be loaded later during setState.
        edge = {
          id: edgeID,
          source: parseInt(sourceNodes[0].id),  // REVIEW: d3data 'source' is id, rename this to 'sourceId'?
                                      // though after d3 processes, source does become an object.
          target: undefined,
          type: '',
          notes: '',
          info: '',
          provenance: provenance_str,
          comments: '',
          citation: '',
          category: ''
        }
        // Expand this EdgeEditor and set it to Edit mode.
        this.setState({
          isExpanded:           true,
          targetIsEditable:     true,
          isBeingEdited:        true
        }, () => {
            // AUTOCOMPLETE mode needs to be set AFTER the edit state has already been set
            // otherwise, the <AutoComplete> component may not have even been defined in the collapsed view.
            this.AppCall('AUTOCOMPLETE_SELECT', { id: 'edge' + this.props.edgeID + 'target' });
        });

        this.AppCall('EDGEEDIT_LOCK', { edgeID: this.props.edgeID });

      } else {

        // LOAD EXISTING EDGE

        // NOTE: NCDATA has not expanded source/target into objects, but remain ids
        sourceNodes = NCDATA.nodes.filter( node => parseInt(node.id)===parseInt(edge.source) );
        targetNodes = NCDATA.nodes.filter( node => parseInt(node.id)===parseInt(edge.target) );

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
          type: edge.type || '',   // Make sure there's valid data
          info: edge.info || '',
          provenance: edge.provenance || '',
          comments: edge.comments || '',
          citation: edge.citation || '',
          category: edge.category || '',
          notes: edge.notes || '',
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
      if (data.edges !== undefined) {
        let updatedEdge = data.edges.find((edge) => { return edge.id === this.state.formData.id; });
        if (!this.state.isBeingEdited && updatedEdge !== undefined) {
          if (DBG) console.log('EdgeEditor: Updating edges with', updatedEdge);
          this.loadSourceAndTarget();
          return;
        }
      }

      // We're being edited, and the updated node is either our source or target
      // Technically we probably ought to also check to make sure we're the current
      // activeAutoCompleteId, but we wouldn't be editable if we weren't.
      if (this.state.isBeingEdited && data.nodes && data.nodes.length > 0) {
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
      const { formData, isBeingEdited, isLocked } = this.state;
      if (DBG) console.log('EdgeEditor',this.state.formData.id,': got state EDGE_EDIT',data,'formData is',this.state.formData);
      if ((data.edgeID !== undefined) && (typeof data.edgeID === "number") && !isBeingEdited &&
        data.edgeID === formData.id
      ) {
        if (!isLocked) {
          this.requestEdit();
        } else {
          console.warn("EdgeEditor.EDGE_EDIT denied because isLocked", isLocked, 'but we will gladly show it!');
          this.handleEdgeSelection(data);
        }
      } else {
        if (typeof data.edgeID !== "number") console.warn("EdgeEditor.EDGE_EDIT called with bad data.nodeID:", data.edgeID);
        if (isBeingEdited) console.warn("EdgeEditor.EDGE_EDIT denied because isBeingEdited", isBeingEdited);
      }

    } // handleEdgeEdit
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ handleEdgeClose() {
      if (this.state.isExpanded) this.setState({ isExpanded: false });
    }
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
/*/ onEdgeClick () {
      // Cancel/Close
      if (this.state.isExpanded) {
        // collapse
        this.setState({ isExpanded: false });

        // If we were editing, then revert and exit
        if (this.state.isBeingEdited) {
          const NCDATA = this.AppState('NCDATA');

          this.setState({ isBeingEdited: false, targetIsEditable: false });
          // Return focus of autocomplete to Search field.
          this.AppCall('AUTOCOMPLETE_SELECT', { id: 'search' });
          // Tell parent node to exit out of edge edit mode
          this.AppCall('EDGEEDIT_UNLOCK', { edgeID: this.props.edgeID });
          // Deregister as an open editor
          if (this.state.isBeingEdited) UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.EDGE });

          // Cancel edit existing or cancel edit new?
          let originalEdge = NCDATA.edges.filter(edge => parseInt(edge.id) === this.props.edgeID)[0];
          if (originalEdge === undefined) {
            // user abandoned editing a new node that was never saved
            const parentNode = NCDATA.nodes.find(node => node.label === this.props.parentNodeLabel);
            // parentNode might be missing if the admin user deleted it.
            if (parentNode) {
              // Unlock edges and reselect the source node
              UDATA.LocalCall('EDGE_NEW_CANCEL', { nodeID: parentNode.id });
            } else {
              // Unlock edges and deselect the missing source node
              UDATA.LocalCall('EDGE_NEW_CANCEL');
            }
            this.clearForm();
          } else {
            // User is abandoning edits to an existing edge.
            // restore original edge
            this.loadSourceAndTarget();
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
      this.AppCall('AUTOCOMPLETE_SELECT', { id: 'search' });
      if (this.state.isBeingEdited) UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.EDGE });
      this.AppCall('EDGEEDIT_UNLOCK', { edgeID: this.props.edgeID }); // inform NodeSelector
      this.AppCall('DB_UPDATE',{edgeID:this.props.edgeID});
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onEditButtonClick () {
      this.setState({ hideModal: true });

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
  /*/
  onCiteButtonClick(event) {
    event.preventDefault();

    this.setState({ hideModal: false });

  } // onCiteButtonClick

  onCloseCiteClick (event) {
    event.preventDefault();

    this.setState({ hideModal: true });

  } //   this.onCloseCiteClick

  dateFormatted () {
    var today = new Date();
    var year = String(today.getFullYear());
    var date = (today.getMonth()+1)+"/"+today.getDate()+"/"+ year.substr(2,4);
    var time = today.toTimeString().substr(0,5);
    var dateTime = time+' on '+date;
    return dateTime;
  }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ requestEdit() {
      let edgeID = this.state.formData.id;
      if (edgeID && edgeID!=='' && !isNaN(edgeID) && (typeof edgeID ==="number") && !this.state.isBeingEdited) {
        this.NetCall('SRV_DBLOCKEDGE', { edgeID: edgeID })
          .then((data) => {
            if (data.NOP) {
              // Edge is locked, can't edit
              if (DBG) console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
              this.setState({
                dbIsLocked: true,
                isExpanded: true
              });
            } else if (data.locked) {
              if (DBG) console.log(`SERVER SAYS: lock success! you can edit Edge ${data.edgeID}`);
              if (DBG) console.log(`SERVER SAYS: unlock the edge after successful DBUPDATE`);
              this.setState({
                isBeingEdited: true,
                isExpanded: true,
                dbIsLocked: false
              });
              this.Signal('EDGEEDIT_LOCK', { edgeID: this.props.edgeID });
              // When a edge is being edited, lock the Template from being edited
              UDATA.NetCall("SRV_REQ_EDIT_LOCK", { editor: EDITORTYPE.EDGE })
                .then(res => {
                  const disableEdit = res.isBeingEdited;
                  this.setState({ disableEdit });
                });
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
        hasValidSource: false,
        placeholder: this.state.sourceNode.label
      });
      this.AppCall('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'source'});
      // Whenever we set the autocomplete to source, we have to update the label
      // Clear the AutoComplete field so that onBlur does not select the same node
      this.AppCall('SOURCE_SEARCH', { searchString: '' });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onChangeTarget () {
      this.setState({
        targetIsEditable: true,
        hasValidTarget: false,
        placeholder: this.state.targetNode.label
      });
      this.AppCall('AUTOCOMPLETE_SELECT',{id:'edge'+this.props.edgeID+'target'});
      // Whenever we set the autocomplete to target, we have to update the label
      // Clear the AutoComplete field so that onBlur does not select the same node
      this.AppCall('SOURCE_SEARCH', { searchString: '' });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onRelationshipChange (event) {
      let formData = this.state.formData;
      formData.type = event.target.value;
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
/*/ onProvenanceChange (event) {
      let formData = this.state.formData;
      formData.provenance = event.target.value;
      this.setState({formData: formData});
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onCommentsChange (event) {
      let formData = this.state.formData;
      formData.comments = event.target.value;
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
/*/ onCategoryChange (event) {
      let formData = this.state.formData;
      formData.category = event.target.value;
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
        type: formData.type,
        info: formData.info,
        provenance: formData.provenance,
        comments: formData.comments,
        citation: formData.citation,
        category: formData.category,
        notes: formData.notes
      }
      if (DBG) console.group('EdgeEntry.onSubmit submitting',edge)

      // Make sure source and target still exist before saving an edge in case
      // admin user deletes a node. This is to prevent data corruption by
      // linking to non-existent nodes. This should probably be moved to nc-logic.
      if (edge) {
        // check source
        const NCDATA = this.AppState('NCDATA');
        const source = NCDATA.nodes.find(node => node.id === edge.source);
        if (!source) {
          alert('Sorry, the source node has been removed.  Please recreate your edge.');
          // Trigger Cancel
          this.onEdgeClick();
          return;
        }
        // check target
        const target = NCDATA.nodes.find(node => node.id === edge.target);
        if (!target) {
          alert('Sorry, the target node has been removed.  Please recreate your edge.');
          // Trigger Cancel
          this.onEdgeClick();
          return;
        }
      }

      // Deregister as an open editor
      UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: 'edge' });
      this.AppCall('EDGEEDIT_UNLOCK', { edgeID: this.props.edgeID }); // inform NodeSelector
      // pass currentAutoComplete back to nodeselector
      this.AppCall('AUTOCOMPLETE_SELECT',{id:'search'});
      this.setState({ isBeingEdited: false, sourceIsEditable: false, targetIsEditable: false });
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
      const { edgeID, parentNodeLabel, parentNodeIsLocked } = this.props;
      const {
        formData,
        sourceNode,
        targetNode,
        edgeDefs,
        isStandalone,
        edgeIsLockedMessage,
        editLockMessage,
        disableEdit
      } = this.state;
      let {citation} = this.state;
      if (edgeDefs.category === undefined) { // for backwards compatability
        edgeDefs.category = {};
        edgeDefs.category.label = "";
        edgeDefs.category.hidden = true;
      }
      if (citation === undefined) { // if citation were left out, simply make them hidden
        citation = {};
        citation.hidden = true;
      }
      const me = <span style={{ color: "rgba(0,0,0,0.2)", fontStyle: "italic" }}>this node</span>;
      // special override to allow editing an edge that has the same parent node for both source and target
      let sameSourceAndTarget = (sourceNode.label === this.props.parentNodeLabel) &&
        (targetNode.label === this.props.parentNodeLabel);

      // Optimize Edge Loading
      // If not expanded, just show the button
      // Only bother to render the whole EdgeEditor if the Edge is being edited
      // This speeds up render times by almost 2 seconds
      if (!this.state.isExpanded) {
        return (
          <div>
            <Button
              outline
              size="sm"
              style={{ backgroundColor: "#a9d3ff", borderColor: 'transparent', width: '100%', marginBottom: '3px', textAlign: "left", overflow: "hidden" }}
              onClick={this.onEdgeClick}
            >{parentNodeLabel === sourceNode.label ? me : sourceNode.label}
              &nbsp;<span title={formData.type}>&#x2794;</span>&nbsp;
              {parentNodeLabel === targetNode.label ? me : targetNode.label}
            </Button>
          </div>
        );
      }

      return (
        <div>

          <div className={this.state.isExpanded?'':'d-none'}>
            <Form className="nodeEntry"
                  style={{backgroundColor:"#C9E1FF",minHeight:'300px',padding:'5px',marginBottom:'10px'}}
                  onSubmit={this.onSubmit}>
              <FormText onClick={this.onEdgeClick}><b>EDGE {formData.id}</b></FormText>
              <FormGroup row>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="source" className="tooltipAnchor small text-muted">
                    {edgeDefs.source.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.source)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <AutoComplete
                    identifier={'edge'+edgeID+'source'}
                    disabledValue={sourceNode.label}
                    inactiveMode={parentNodeLabel===sourceNode.label ? 'static' : this.state.isBeingEdited ? 'disabled' : 'link'}
                    linkID={sourceNode.id}
                    shouldIgnoreSelection={!this.state.sourceIsEditable}
                    placeholder={this.state.placeholder}
                  />
                  <Button outline size="sm" className="float-right"
                    hidden={ !(this.state.isBeingEdited &&
                               this.state.hasValidSource &&
                               (sourceNode.label!==this.props.parentNodeLabel)) }
                    onClick={this.onChangeSource}
                    title="Select a different source node"
                  >Change Source</Button>
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgeDefs.type.hidden}>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="relationship" className="tooltipAnchor small text-muted">
                    {edgeDefs.type.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.type)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <Input type="select" name="relationship"
                    value={formData.type}
                    onChange={this.onRelationshipChange}
                    disabled={!this.state.isBeingEdited}
                    >
                    {edgeDefs.type.options.map( option => (
                      <option key={option.label}>{option.label}</option>
                    ))}
                  </Input>
                </Col>
              </FormGroup>
              <FormGroup row>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="nodeLabel" className="tooltipAnchor small text-muted">
                    {edgeDefs.target.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.target)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <AutoComplete
                    identifier={'edge'+edgeID+'target'}
                    disabledValue={targetNode.label}
                    inactiveMode={ ( parentNodeLabel===targetNode.label && !sameSourceAndTarget ) ? 'static' : this.state.isBeingEdited ? 'disabled' : 'link'}
                    linkID={targetNode.id}
                    shouldIgnoreSelection={!this.state.targetIsEditable}
                    placeholder={this.state.placeholder}
                  />
                  <Button outline size="sm" className="float-right"
                    hidden={ !(this.state.isBeingEdited &&
                               this.state.hasValidTarget &&
                               ( (targetNode.label !== this.props.parentNodeLabel) ||
                                 sameSourceAndTarget )
                              )
                            }
                    onClick={this.onChangeTarget}
                    title="Select a different target node"
                  >Change Target</Button>
                  <Button outline size="sm" className="float-right" style={{marginRight:'5px'}}
                    hidden={!(this.state.isBeingEdited && this.state.hasValidTarget)}
                    onClick={this.onSwapSourceAndTarget}
                    title="Swap 'Source' and 'Target' nodes"
                  >&uarr;&darr;</Button>
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgeDefs.category.hidden}>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="category" className="tooltipAnchor small text-muted">
                    {edgeDefs.category.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.category)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <Input type="text" name="category"
                    value={formData.category}
                    onChange={this.onCategoryChange}
                    readOnly={!this.state.isBeingEdited}
                  />
                </Col>
              </FormGroup><FormGroup row hidden={edgeDefs.citation.hidden}>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="citation" className="tooltipAnchor small text-muted">
                    {edgeDefs.citation.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.citation)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <Input type="text" name="citation"
                    value={formData.citation}
                    onChange={this.onCitationChange}
                    readOnly={!this.state.isBeingEdited}
                  />
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgeDefs.notes.hidden}>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="notes" className="tooltipAnchor small text-muted">
                    {edgeDefs.notes.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.notes)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <Input type="textarea" name="notes"
                    style={{display: this.state.isBeingEdited ? 'block' : 'none'}}
                    value={formData.notes}
                    onChange={this.onNotesChange}
                    readOnly={!this.state.isBeingEdited}
                  />
                  {this.markdownDisplay(this.state.formData.notes||'')}
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgeDefs.info.hidden}>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="info" className="tooltipAnchor small text-muted">
                    {edgeDefs.info.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.info)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <Input type="text" name="info"
                    value={formData.info}
                    onChange={this.onInfoChange}
                    readOnly={!this.state.isBeingEdited}
                  />
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgeDefs.provenance.hidden}>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="provenance" className="tooltipAnchor small text-muted">
                    {edgeDefs.provenance.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.provenance)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <Input type="text" name="provenance"
                    value={formData.provenance}
                    onChange={this.onProvenanceChange}
                    readOnly={!this.state.isBeingEdited}
                  />
                </Col>
              </FormGroup>
              <FormGroup row hidden={edgeDefs.comments.hidden}>
                <Col sm={3} style={{hyphens: 'auto'}} className="pr-0">
                  <Label for="comments" className="tooltipAnchor small text-muted">
                    {edgeDefs.comments.displayLabel}
                    <span className="tooltiptext">{this.helpText(edgeDefs.comments)}</span>
                  </Label>
                </Col>
                <Col sm={9}>
                  <textarea type="text" name="comments" className="comments"
                    rows="4"
                    value={formData.comments}
                    onChange={this.onCommentsChange}
                    readOnly={!this.state.isBeingEdited}
                    disabled={!this.state.isBeingEdited}
                  />
                </Col>
              </FormGroup>
              <div id="citationWindow" hidden={this.state.hideModal} className="modal-content">
                <span className="close" onClick={this.onCloseCiteClick}>&times;</span>
                <p><em>Copy the text below:</em><br/><br/>
                  NetCreate {this.AppState('TEMPLATE').name} network, Edge: {this.state.formData.label} (ID {this.state.formData.id}), from "{sourceNode.label}" to "{targetNode.label}". {citation.text}. Last accessed at {this.dateFormatted()}.</p>
              </div><br/>
              <FormGroup className="text-right" style={{paddingRight:'5px'}}>
                <Button className="small float-left btn btn-outline-light" size="sm"
                  hidden={this.state.isLocked || isStandalone || parentNodeIsLocked}
                  onClick={this.onDeleteButtonClick}
                >Delete</Button>&nbsp;
                <Button outline size="sm"
                  hidden={ citation.hidden}
                  onClick={this.onCiteButtonClick}
                >Cite Edge</Button>&nbsp;&nbsp;
                <Button outline size="sm"
                  hidden={this.state.isLocked || isStandalone || this.state.isBeingEdited || parentNodeIsLocked}
                  disabled={disableEdit}
                  onClick={this.onEditButtonClick}
                >{this.state.isBeingEdited ? "Add New Edge" : "Edit Edge"}</Button>&nbsp;
                <Button size="sm"
                  outline={this.state.isBeingEdited}
                  onClick={this.onEdgeClick}
                >{this.state.isBeingEdited?'Cancel':'Close'}</Button>&nbsp;
                <Button color="primary" size="sm"
                  hidden={!this.state.isBeingEdited}
                  disabled={ !(this.state.isBeingEdited && this.state.hasValidTarget) }
                >Save</Button>
                <div hidden={this.state.isLocked || this.state.isBeingEdited || parentNodeIsLocked} style={{ display: 'inline' }}>
                  <p hidden={!this.state.dbIsLocked} className="small text-danger warning">{edgeIsLockedMessage}</p>
                  <p hidden={!disableEdit} className="small text-danger warning">{editLockMessage}</p>
                </div>
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
      this.updateEditState();
      this.setState({
        // hide Edit button if in standalone mode
        isStandalone: UNISYS.IsStandaloneMode()
      });
      window.addEventListener("beforeunload", this.checkUnload);
      window.addEventListener("unload", this.doUnload);
    }

    checkUnload(e) {
      e.preventDefault();
      if (this.state.isBeingEdited) {
        (e || window.event).returnValue = null;
      } else {
        Reflect.deleteProperty(e, 'returnValue');
      }
      return e;
    }

    doUnload(e) {
      if (this.state.isBeingEdited) {
        this.NetCall('SRV_DBUNLOCKEDGE', { edgeID: this.state.formData.id });
        this.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.EDGE });
      }
    }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Release the lock if we're unmounting
/*/ componentWillUnmount() {
      if (DBG) console.log('EdgeEditor.componentWillUnMount!');
      if (this.state.isBeingEdited) {
        this.NetCall('SRV_DBUNLOCKEDGE', { edgeID: this.state.formData.id })
          .then((data) => {
            if (data.NOP) {
              if (DBG) console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
            } else if (data.unlocked) {
              if (DBG) console.log(`SERVER SAYS: unlock success! you have released Edge ${data.edgeID}`);
              this.setState({ dbIsLocked: false });
            }
          });
        // Deregister as an open editor
        this.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.EDGE });
      }
      // deregister ACTIVEAUTOMPLETE when component unmounts
      // otherwise state updates trigger a setState on unmounted component error
      this.AppStateChangeOff('SESSION', this.onStateChange_SESSION);
      this.AppStateChangeOff('SELECTION', this.handleSelection);
      this.AppStateChangeOff('TEMPLATE', this.setTemplate);
      UDATA.UnhandleMessage('EDGE_SELECT', this.handleEdgeSelection);
      UDATA.UnhandleMessage('EDGE_EDIT', this.handleEdgeEdit);
      UDATA.UnhandleMessage('EDGE_CLOSE', this.handleEdgeClose);
      UDATA.UnhandleMessage('EDIT_PERMISSIONS_UPDATE', this.setEditState);
      window.removeEventListener("beforeunload", this.checkUnload);
      window.removeEventListener("unload", this.doUnload);
    }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/

    helpText(obj) {
      if (!obj) return;
      var text = "";
      if (obj.help === undefined || obj.help === "") text = obj.label;
      else text = obj.help;
      return text;
    }


    markdownDisplay (text) {
      if (!this.state.isBeingEdited) {
        return mdReact({
          onIterate: this.markdownIterate,
          markdownOptions: { typographer: true, linkify: true },
          plugins: [mdplugins.emoji]
        })(text);
      }
    }

    markdownIterate(Tag, props, children, level) {
      if (Tag === 'a') {
        props.target = '_blank';
      }
      return <Tag {...props}>{children}</Tag>;
    }

} // class EdgeEditor


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeEditor;
