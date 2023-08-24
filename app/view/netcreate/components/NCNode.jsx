/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Prototype Simple NetCreate Node Editor

  Built for Version 2.0 ITEST.

  Provides a viewer and editor for the currently selected node.

  USAGE

    <NCNode />

  Main changes for 2.0:
  * Node data is made up of built-in parameters (e.g. label, provenance),
    and arbitrary custom parameters defined via the template.  This Node
    editor can support wide variety of data.

  DATA UPDATES
  * Updates are triggered mostly by:
    1.  SELECTION state updates when nodes and edges change
    2.  PERMISSION state updates when locks are set and released.

  Data is currently in a transitional state.
  Currently all properties are saved in a flat list.
  Eventually we might want to differentiate between
  built-in properties (e.g. id, created), and template-defined custom
  `attributes`.  There is an awkward translation between these two
  representations during data load, update, and save.


  PERMISSIONS
  Editting is restricted by:
  * User must be logged in
  * Template is not being edited
  * Data is not being imported
  * Someone else is not editing the node (and has placed a lock on it)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const EDGEMGR = require('../edge-mgr'); // handles edge synthesis
const { EDITORTYPE, BUILTIN_FIELDS_NODE } = require('system/util/enum');
const NCUI = require('../nc-ui');
const NCEdge = require('./NCEdge');
const SETTINGS = require('settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCNode';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const isAdmin = SETTINGS.IsAdmin();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VIEWMODE = {
  EDIT: 'edit',
  VIEW: 'view'
};
const TABS = {
  // Also used as labels
  ATTRIBUTES: 'ATTRIBUTES',
  EDGES: 'EDGES',
  PROVENANCE: 'PROVENANCE'
};
const EDGE_NOT_SET_LABEL = '...';
const ARROW_RIGHT = `\u2794`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let UDATA;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCNode extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: false
    }; // initialized on componentDidMount and clearSelection

    // STATE MANAGEMENT
    this.ResetState = this.ResetState.bind(this);
    this.UpdateSession = this.UpdateSession.bind(this);
    this.UpdateNCData = this.UpdateNCData.bind(this);
    this.SetPermissions = this.SetPermissions.bind(this);
    this.UpdatePermissions = this.UpdatePermissions.bind(this);

    // EVENT HANDLERS
    this.CheckUnload = this.CheckUnload.bind(this);
    this.DoUnload = this.DoUnload.bind(this);
    this.ClearSelection = this.ClearSelection.bind(this);
    this.UpdateSelection = this.UpdateSelection.bind(this);
    this.SelectEdgeAndEdit = this.SelectEdgeAndEdit.bind(this);
    this.SeselectEdge = this.SeselectEdge.bind(this);
    // DATA LOADING
    this.LoadNode = this.LoadNode.bind(this);
    this.LoadEdges = this.LoadEdges.bind(this);
    this.LoadAttributes = this.LoadAttributes.bind(this);
    this.LockNode = this.LockNode.bind(this);
    this.UnlockNode = this.UnlockNode.bind(this);
    this.IsNodeLocked = this.IsNodeLocked.bind(this);
    // DATA SAVING
    this.SaveNode = this.SaveNode.bind(this);
    this.DeleteNode = this.DeleteNode.bind(this);
    // HELPER METHODS
    this.SetBackgroundColor = this.SetBackgroundColor.bind(this);
    // UI HANDLERS
    this.UISelectTab = this.UISelectTab.bind(this);
    this.UIRequestEditNode = this.UIRequestEditNode.bind(this);
    this.UIReplacementNodeIdUpdate = this.UIReplacementNodeIdUpdate.bind(this);
    this.UIAddEdge = this.UIAddEdge.bind(this);
    this.EnableEditMode = this.EnableEditMode.bind(this);
    this.UICancelEditMode = this.UICancelEditMode.bind(this);
    this.UIDisableEditMode = this.UIDisableEditMode.bind(this);
    this.UIInputUpdate = this.UIInputUpdate.bind(this);
    this.UILabelInputUpdate = this.UILabelInputUpdate.bind(this);
    this.UIViewEdge = this.UIViewEdge.bind(this);
    this.UIEditEdge = this.UIEditEdge.bind(this);
    // RENDERERS -- Main
    this.RenderView = this.RenderView.bind(this);
    this.RenderEdit = this.RenderEdit.bind(this);
    // RENDER HELPERS
    this.RenderEdgesTab = this.RenderEdgesTab.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// REGISTER LISTENERS
    UDATA.OnAppStateChange('SESSION', this.UpdateSession);
    UDATA.OnAppStateChange('NCDATA', this.UpdateNCData);
    UDATA.OnAppStateChange('SELECTION', this.UpdateSelection);
    UDATA.HandleMessage('EDIT_PERMISSIONS_UPDATE', this.SetPermissions);
    UDATA.HandleMessage('NODE_EDIT', this.UIRequestEditNode); // Node Table request
    UDATA.HandleMessage('EDGE_SELECT_AND_EDIT', this.SelectEdgeAndEdit);
    UDATA.HandleMessage('EDGE_DESELECT', this.SeselectEdge);
  }

  componentDidMount() {
    this.ResetState(); // Initialize State
    window.addEventListener('beforeunload', this.CheckUnload);
    window.addEventListener('unload', this.DoUnload);
  }
  componentWillUnmount() {
    UDATA.AppStateChangeOff('SESSION', this.UpdateSession);
    UDATA.AppStateChangeOff('NCDATA', this.UpdateNCData);
    UDATA.AppStateChangeOff('SELECTION', this.UpdateSelection);
    UDATA.UnhandleMessage('EDIT_PERMISSIONS_UPDATE', this.SetPermissions);
    UDATA.UnhandleMessage('NODE_EDIT', this.UIRequestEditNode);
    window.removeEventListener('beforeunload', this.CheckUnload);
    window.removeEventListener('unload', this.DoUnload);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// STATE MANAGEMENT
  ///
  ResetState() {
    const TEMPLATE = this.AppState('TEMPLATE');
    this.setState({
      // SYSTEM STATE
      // isLoggedIn: false, // don't clear session state!
      // isAdmin: false,
      previousState: {},
      // UI State
      editBtnDisable: false,
      editBtnHide: false,
      viewMode: VIEWMODE.VIEW,
      uSelectedTab: TABS.ATTRIBUTES,
      selectedEdgeId: null,
      backgroundColor: 'transparent',
      isLockedByDB: false, // shows db lock message next to Edit Node button
      isLockedByTemplate: false,
      isLockedByImport: false,
      editLockMessage: '',
      uHideDeleteNodeButton: TEMPLATE.hideDeleteNodeButton,
      uReplacementNodeId: '',
      uIsValidReplacementNodeID: true,
      // NODE DEFS
      id: null,
      label: '',
      degrees: null,
      attributes: [],
      provenance: [],
      created: undefined,
      updated: undefined,
      revision: 0,
      // EDGES
      edges: [] // selected nodes' edges not ALL edges
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// EVENT HANDLERS
  ///
  CheckUnload(event) {
    event.preventDefault();
    if (this.state.viewMode === VIEWMODE.EDIT) {
      (event || window.event).returnValue = null;
    } else {
      Reflect.deleteProperty(event, 'returnValue');
    }
    return event;
  }
  DoUnload(event) {
    if (this.state.viewMode === VIEWMODE.EDIT) {
      UDATA.NetCall('SRV_DBUNLOCKNODE', { nodeID: this.state.id });
      UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.NODE });
    }
  }

  /**
   * Handle change in SESSION data
   * SESSION is called by SessionShell when the ID changes
   * set system-wide. data: { classId, projId, hashedId, groupId, isValid }
   * Called both by componentWillMount() and AppStateChange handler.
   * The 'SESSION' state change is triggered in two places in SessionShell during
   * its handleChange() when active typing is occuring, and also during
   * SessionShell.componentWillMount()
   */
  UpdateSession(decoded) {
    this.setState({ isLoggedIn: decoded.isValid }, () => this.UpdatePermissions());
  }
  /*
      Called by NCDATA AppState updates
  */
  UpdateNCData() {
    this.LoadEdges(this.state.id);
  }
  SetPermissions(data) {
    const { id } = this.state;
    const nodeIsLocked = data.lockedNodes.includes(id);
    this.setState(
      {
        isLockedByDB: nodeIsLocked,
        isLockedByTemplate: data.templateBeingEdited,
        isLockedByImport: data.importActive
      },
      () => this.UpdatePermissions()
    );
  }
  UpdatePermissions() {
    const { isLoggedIn, isLockedByDB, isLockedByTemplate, isLockedByImport } =
      this.state;
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    let editLockMessage = '';
    let editBtnDisable = false;
    let editBtnHide = true;
    if (isLoggedIn) editBtnHide = false;
    if (isLockedByDB) {
      editBtnDisable = true;
      editLockMessage += TEMPLATE.nodeIsLockedMessage;
    }
    if (isLockedByTemplate) {
      editBtnDisable = true;
      editLockMessage += TEMPLATE.templateIsLockedMessage;
    }
    if (isLockedByImport) {
      editBtnDisable = true;
      editLockMessage += TEMPLATE.importIsLockedMessage;
    }
    this.setState({ editBtnDisable, editBtnHide, editLockMessage });
  }
  ClearSelection() {
    this.ResetState();
  }
  UpdateSelection(data) {
    if (!data.nodes) return; // SELECTION cleared?
    const node = data.nodes[0]; // select the first node
    this.LoadNode(node);
  }
  /**
   * In order to edit an edge, we must first select the source
   * 1. (this assumes SOURCE_SELECT was already called)
   * 2. select the Edges tab
   * 3. open the edge (load the edge data into NCEdge)
   * 4. trigger edge edit mode
   * @param {Object} data
   * @param {string} data.edgeId
   */
  SelectEdgeAndEdit(data) {
    const { edgeId } = data;
    this.setState({ uSelectedTab: TABS.EDGES, selectedEdgeId: edgeId }, () => {
      const { edges } = this.state;
      const edge = edges.find(e => e.id === Number(edgeId));
      this.setState({ selectedEdgeId: edgeId });
      UDATA.LocalCall('EDGE_OPEN', { edge }).then(() => {
        UDATA.LocalCall('EDGE_EDIT', { edgeId });
      });
    });
  }
  SeselectEdge() {
    this.setState({ selectedEdgeId: null });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA LOADING
  ///
  LoadNode(node) {
    const { id, viewMode } = this.state;

    // If we're editing, ignore the select!
    if (viewMode === VIEWMODE.EDIT) return;

    // If no node was selected, deselect
    if (!node) {
      this.ClearSelection();
      return;
    }

    // if we're loading a new node, close any open edges
    if (node.id !== id) UDATA.LocalCall('EDGE_DESELECT');

    // Load the node
    const attributes = this.LoadAttributes(node);
    this.setState(
      {
        id: node.id,
        label: node.label,
        degrees: node.degrees,
        attributes: attributes,
        provenance: node.provenance,
        created: node.created,
        updated: node.updated,
        revision: node.revision
      },
      () => {
        this.SetBackgroundColor();
        this.LoadEdges(node.id);
        this.IsNodeLocked(nodeIsLocked => {
          this.setState(
            {
              isLockedByDB: nodeIsLocked
            },
            () => this.UpdatePermissions()
          );
        });
      }
    );
  }
  LoadEdges(id) {
    // -- First, sort edges by source, then target
    const NCDATA = UDATA.AppState('NCDATA');
    const linkedEdges = NCDATA.edges.filter(e => e.source === id || e.target === id);
    linkedEdges.sort((a, b) => {
      // same source label, sort on target
      if (a.sourceLabel === b.sourceLabel) {
        if (a.targetLabel < b.targetLabel) return -1;
        if (a.targetLabel > b.targetLabel) return 1;
      }
      // Always list `this` node first
      if (a.source === id) return -1;
      if (b.source === id) return 1;
      // Otherwise sort on source
      if (a.sourceLabel < b.sourceLabel) return -1;
      if (a.sourceLabel > b.sourceLabel) return 1;
      return 0;
    });
    this.setState({ edges: linkedEdges });
  }
  /**
   * Loads up the `attributes` object defined by the TEMPLATE
   * Will skip
   *   * BUILTIN fields
   *   * attributes that are `hidden` by the template
   * REVIEW: Currently the parameters will show up in random object order.
   * @param {Object} node
   * @returns {Object} { ...attr-key: attr-value }
   */
  LoadAttributes(node) {
    const NODEDEFS = UDATA.AppState('TEMPLATE').nodeDefs;
    const attributes = {};
    Object.keys(NODEDEFS).forEach(k => {
      if (BUILTIN_FIELDS_NODE.includes(k)) return; // skip built-in fields
      const attr_def = NODEDEFS[k];
      if (attr_def.hidden) return; // skip hidden fields
      attributes[k] = node[k];
    });
    return attributes;
  }

  /**
   * Tries to lock the node for editing.
   * If the lock fails, then it means the node was already locked
   * previously and we're not allowed to edit
   * @param {function} cb callback function
   * @returns {boolean} true if lock was successful
   */
  LockNode(cb) {
    const { id } = this.state;
    let lockSuccess = false;
    UDATA.NetCall('SRV_DBLOCKNODE', { nodeID: id }).then(data => {
      if (data.NOP) {
        console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
      } else if (data.locked) {
        console.log(`SERVER SAYS: lock success! you can edit Node ${data.nodeID}`);
        console.log(`SERVER SAYS: unlock the node after successful DBUPDATE`);
        lockSuccess = true;
        // When a node is being edited, lock the Template from being edited
        UDATA.NetCall('SRV_REQ_EDIT_LOCK', { editor: EDITORTYPE.NODE });
      }
      if (typeof cb === 'function') cb(lockSuccess);
    });
  }
  UnlockNode(cb) {
    const { id } = this.state;
    let unlockSuccess = false;
    UDATA.NetCall('SRV_DBUNLOCKNODE', { nodeID: id }).then(data => {
      if (data.NOP) {
        console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
      } else if (data.unlocked) {
        console.log(
          `SERVER SAYS: unlock success! you have released Node ${data.nodeID}`
        );
        unlockSuccess = true;
        // Release Template lock
        UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.NODE });
      }
      if (typeof cb === 'function') cb(unlockSuccess);
    });
  }
  IsNodeLocked(cb) {
    const { id } = this.state;
    let nodeIsLocked = false;
    UDATA.NetCall('SRV_DBISNODELOCKED', { nodeID: id }).then(data => {
      if (data.NOP) {
        console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
      } else if (data.locked) {
        console.log(
          `SERVER SAYS: Node is locked! You cannot edit Node ${data.nodeID}`
        );
        nodeIsLocked = true;
      }
      if (typeof cb === 'function') cb(nodeIsLocked);
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA SAVING
  ///
  SaveNode() {
    const { id, label, attributes, provenance, created, updated, revision } =
      this.state;

    const node = { id, label, provenance, created, updated, revision };
    Object.keys(attributes).forEach(k => (node[k] = attributes[k]));

    // write data to database
    // setting dbWrite to true will distinguish this update
    // from a remote one
    this.AppCall('DB_UPDATE', { node }).then(() => {
      this.UnlockNode(() => {
        this.setState({
          viewMode: VIEWMODE.VIEW,
          isLockedByDB: false
        });
      });
    });
  }
  DeleteNode() {
    const { id, uReplacementNodeId } = this.state;

    // Re-link edges or delete edges?
    // `NaN` is not valid JSON, so we need to pass -1
    const replacementNodeID =
      uReplacementNodeId === '' ? -1 : parseInt(uReplacementNodeId); // '' = Delete edges by default

    this.ResetState();
    this.AppCall('DB_UPDATE', {
      nodeID: id,
      replacementNodeID: replacementNodeID
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// HELPER METHODS
  /**
   * Sets the background color of the node editor via `backgroundColor` state.
   * Currently the background color is determined by the template node type
   * color mapping.  This will eventually be replaced with a color manager.
   */
  SetBackgroundColor() {
    const { attributes } = this.state;
    const type = attributes && attributes.type;
    const COLORMAP = UDATA.AppState('COLORMAP');
    const backgroundColor = COLORMAP.nodeColorMap[type] || '#555555';
    this.setState({ backgroundColor });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS

  UISelectTab(event) {
    const uSelectedTab = event.target.value;
    this.setState({ uSelectedTab });
    if (event.target.value !== TABS.EDGES) UDATA.LocalCall('EDGE_DESELECT');
  }
  /**
   * If `lockNode` is not successful, then that means the node was
   * already locked, so we can't edit.
   */
  UIRequestEditNode() {
    this.LockNode(lockSuccess => {
      this.setState({ isLockedByDB: !lockSuccess }, () => {
        if (lockSuccess) this.EnableEditMode();
      });
    });
  }

  UIReplacementNodeIdUpdate(event) {
    const replacementNodeId = parseInt(event.target.value);
    let isValid = false;
    // Allow `` because we use a a blank field to indicate delete node without relinking edges.
    if (
      event.target.value === '' ||
      UDATA.AppState('NCDATA').nodes.find(node => {
        return node.id === replacementNodeId;
      })
    ) {
      isValid = true;
    }
    this.setState({
      uReplacementNodeId: replacementNodeId,
      uIsValidReplacementNodeID: isValid
    });
  }

  UIAddEdge(event) {
    event.preventDefault();
    UDATA.LocalCall('EDGE_CREATE', { nodeId: this.state.id }).then(edge => {
      // enable editing right away
      this.UIEditEdge(edge.id);
    });
  }

  EnableEditMode() {
    const { uSelectedTab, label, attributes, provenance } = this.state;
    // If user was on Edges tab while requesting edit (e.g. from Node Table), then
    // switch to Attributes tab first.
    const editableTab = uSelectedTab === TABS.EDGES ? TABS.ATTRIBUTES : uSelectedTab;
    const previousState = {
      label,
      attributes: Object.assign({}, attributes)
      // provenance: Object.assign({}, provenance) // uncomment after provenence is implemented
    };
    this.setState({
      viewMode: VIEWMODE.EDIT,
      uSelectedTab: editableTab,
      previousState
    });
  }

  UICancelEditMode() {
    const { previousState } = this.state;
    // restore previous state
    this.setState(
      {
        label: previousState.label,
        attributes: previousState.attributes
        // provenance: previousState.provenance // uncomment after provenence is implemented
      },
      () => this.UIDisableEditMode()
    );
  }

  UIDisableEditMode() {
    this.UnlockNode(() => {
      this.setState({
        viewMode: VIEWMODE.VIEW,
        isLockedByDB: false
      });
      UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.NODE });
    });
  }
  UIInputUpdate(key, value) {
    if (BUILTIN_FIELDS_NODE.includes(key)) {
      const data = {};
      data[key] = value;
      this.setState(data);
    } else {
      const { attributes } = this.state;
      attributes[key] = value;
      this.setState({ attributes }, () => this.SetBackgroundColor());
    }
  }
  UILabelInputUpdate(key, value) {
    const data = {};
    data[key] = value;
    console.warn('Labelinput', key, value);
    this.setState(data);
    UDATA.LocalCall('FIND_MATCHING_NODES', { searchString: value }).then(data => {
      const foundLabels =
        data.nodes && data.nodes.length > 0
          ? data.nodes.map(d => d.label)
          : undefined;
      this.setState({ matchingNodeLabels: foundLabels });
    });
  }

  UIViewEdge(edgeId) {
    const { edges } = this.state;
    const edge = edges.find(e => e.id === Number(edgeId));
    this.setState({ selectedEdgeId: edgeId });
    UDATA.LocalCall('EDGE_OPEN', { edge });
  }

  UIEditEdge(edgeId) {
    const { edges } = this.state;
    const edge = edges.find(e => e.id === Number(edgeId));
    this.setState({ selectedEdgeId: edgeId });
    UDATA.LocalCall('EDGE_OPEN', { edge }).then(() =>
      UDATA.LocalCall('EDGE_EDIT', { edge })
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER METHODS
  RenderView() {
    const {
      uSelectedTab,
      backgroundColor,
      editBtnDisable,
      editBtnHide,
      editLockMessage,
      uHideDeleteNodeButton,
      uReplacementNodeId,
      uIsValidReplacementNodeID,
      id,
      label
    } = this.state;
    const defs = UDATA.AppState('TEMPLATE').nodeDefs;
    const bgcolor = backgroundColor + '44'; // hack opacity
    return (
      <div className="nccomponent">
        <div className="view" style={{ background: bgcolor }}>
          {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
          <div className="titlebar">
            <div className="nodelabel">{NCUI.RenderLabel('label', label)}</div>
            <div className="nodenumber">#{id}</div>
          </div>
          {/* TABS - - - - - - - - - - - - - - - - - - - */}
          <div className="tabcontainer">
            {NCUI.RenderTabSelectors(TABS, this.state, this.UISelectTab)}
            <div className="tabview">
              {uSelectedTab === TABS.ATTRIBUTES &&
                NCUI.RenderAttributesTabView(this.state, defs)}
              {uSelectedTab === TABS.EDGES && this.RenderEdgesTab()}
              {uSelectedTab === TABS.PROVENANCE &&
                NCUI.RenderProvenanceTabView(this.state, defs)}
            </div>
          </div>
          {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
          <div className="controlbar">
            {!editBtnHide && uSelectedTab !== TABS.EDGES && (
              <button
                id="editbtn"
                onClick={this.UIRequestEditNode}
                disabled={editBtnDisable}
              >
                Edit
              </button>
            )}
          </div>
          {editLockMessage && (
            <div className="message warning">{editLockMessage}</div>
          )}
          {isAdmin && !editBtnDisable && !uHideDeleteNodeButton && (
            <div className="controlbar deletenode">
              <div className="message">
                Re-link edges to this Node ID (leave blank to delete edge)
              </div>
              <div>
                <input
                  type="number"
                  id="replacementNodeID"
                  className={`deleteinput ${
                    uIsValidReplacementNodeID ? '' : 'invalid'
                  }`}
                  value={uReplacementNodeId || ''}
                  onChange={this.UIReplacementNodeIdUpdate}
                />
                {!uIsValidReplacementNodeID && (
                  <div className="message warning">Invalid Node ID!</div>
                )}
              </div>
              <button onClick={this.DeleteNode}>Delete</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  RenderEdit() {
    const { uSelectedTab, backgroundColor, matchingNodeLabels, label } = this.state;
    const defs = UDATA.AppState('TEMPLATE').nodeDefs;
    const bgcolor = backgroundColor + '66'; // hack opacity
    const matchList = matchingNodeLabels
      ? matchingNodeLabels.map(l => <div key={l}>{l}</div>)
      : undefined;
    const duplicateWarning = UDATA.AppState('TEMPLATE').duplicateWarning;
    const isDuplicate = matchingNodeLabels && matchingNodeLabels.includes(label);
    return (
      <div>
        <div className="screen"></div>
        <div className="nccomponent">
          <div
            className="edit"
            style={{
              background: bgcolor,
              borderColor: backgroundColor
            }}
          >
            {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
            <div className="nodelabel">
              {NCUI.RenderStringInput('label', label, this.UILabelInputUpdate)}
            </div>
            {/* <div className="nodelabel">{this.renderLabelInput('label', label)}</div> */}
            {matchList && (
              <div className="matchlist">
                {isDuplicate && (
                  <div className="message warning">{duplicateWarning}</div>
                )}
                {matchList}
              </div>
            )}
            {/* TABS - - - - - - - - - - - - - - - - - - - */}
            <div className="tabcontainer">
              {NCUI.RenderTabSelectors(TABS, this.state, this.UISelectTab)}
              <div className="tabview">
                {uSelectedTab === TABS.ATTRIBUTES &&
                  NCUI.RenderAttributesTabEdit(this.state, defs, this.UIInputUpdate)}
                {uSelectedTab === TABS.EDGES && this.RenderEdgesTab()}
                {uSelectedTab === TABS.PROVENANCE &&
                  NCUI.RenderProvenanceTabEdit(this.state, defs, this.UIInputUpdate)}
              </div>
            </div>
            {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
            <div className="controlbar">
              <button className="cancelbtn" onClick={this.UICancelEditMode}>
                Cancel
              </button>
              <button onClick={this.SaveNode}>Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER HELPERS
  ///
  RenderEdgesTab() {
    const {
      uSelectedTab,
      selectedEdgeId,
      editBtnDisable,
      editBtnHide,
      id,
      label,
      edges
    } = this.state;
    const NCDATA = UDATA.AppState('NCDATA');
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    const me = (
      <span style={{ color: 'rgba(0,0,0,0.2)', fontStyle: 'italic' }}>this node</span>
    );
    return (
      <div className="edges">
        {edges.map(e => {
          const sourceNode = NCDATA.nodes.find(n => n.id === e.source) || {
            label: EDGE_NOT_SET_LABEL
          };
          const targetNode = NCDATA.nodes.find(n => n.id === e.target) || {
            label: EDGE_NOT_SET_LABEL
          };
          const color = EDGEMGR.LookupEdgeColor(e, TEMPLATE);
          const bgcolor = color + '33'; // opacity hack
          if (e.id === selectedEdgeId) {
            return <NCEdge key={e.id} edge={e} parentNodeId={id} />;
          } else {
            return (
              <div key={e.id}>
                <button
                  className="edgebutton"
                  onClick={() => this.UIViewEdge(e.id)}
                  style={{ backgroundColor: bgcolor }}
                >
                  {id === e.source ? me : sourceNode.label}
                  &nbsp;<span title={e.type}>{ARROW_RIGHT}</span>&nbsp;
                  {id === e.target ? me : targetNode.label}
                </button>
              </div>
            );
          }
        })}
        {!editBtnHide && uSelectedTab === TABS.EDGES && (
          <button
            className="addedgebutton"
            onClick={this.UIAddEdge}
            disabled={editBtnDisable}
          >
            New Edge
          </button>
        )}
      </div>
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// MAIN RENDER
  render() {
    const { id, viewMode } = this.state;
    if (!id) return ''; // nothing selected
    if (viewMode === VIEWMODE.VIEW) {
      return this.RenderView();
    } else {
      return this.RenderEdit();
    }
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCNode;
