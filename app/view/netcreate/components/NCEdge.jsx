/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Prototype Simple NetCreate Edge Editor

    Built for Version 2.0 ITEST.

    Provides a viewer and editor for the currently selected edge.

    USAGE

      <NCNEdge key={e.id} edge={edge} parentNodeId={nodeId}/>

    This is designed to be embedded in an <NCNode> object.
    There should only be one open NCEdge component at a time.

    PERMISSIONS
    Editting is restricted by:
    * User must be logged in
    * Template is not being edited
    * Data is not being imported
    * Someone else is not editing the edge (and has placed a lock on it)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'NCEdge';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UNISYS = require('unisys/client');
const { EDITORTYPE } = require('system/util/enum');
const NCUI = require('../nc-ui');
const NCAutoSuggest = require('./NCAutoSuggest');
const NCDialog = require('./NCDialog');

let UDATA;
const BUILTIN_FIELDS = [
  'id',
  'source',
  'target',
  'provenance',
  'degrees',
  'created',
  'updated',
  'revision'
];
const TABS = {
  // Also used as labels
  ATTRIBUTES: 'ATTRIBUTES',
  PROVENANCE: 'PROVENANCE'
};

const EDGE_NOT_SET_LABEL = '...';
const ARROW_DOWN = `\u2193`;
const ARROW_UPDOWN = `\u21F5`;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCEdge extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: false,
      animateHeight: 0
    }; // initialized on componentDidMount and clearSelection

    // STATE MANAGEMENT
    this.resetState = this.resetState.bind(this);
    this.updateSession = this.updateSession.bind(this);
    this.isLoggedIn = this.isLoggedIn.bind(this);
    this.setPermissions = this.setPermissions.bind(this);
    this.updatePermissions = this.updatePermissions.bind(this);

    // EVENT HANDLERS
    this.checkUnload = this.checkUnload.bind(this);
    this.doUnload = this.doUnload.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.reqLoadEdge = this.reqLoadEdge.bind(this);
    // DATA LOADING
    this.loadEdge = this.loadEdge.bind(this);
    this.loadAttributes = this.loadAttributes.bind(this);
    this.lockEdge = this.lockEdge.bind(this);
    this.UnlockEdge = this.UnlockEdge.bind(this);
    this.isEdgeLocked = this.isEdgeLocked.bind(this);
    this.editEdge = this.editEdge.bind(this);
    this.UpdateDerivedValues = this.UpdateDerivedValues.bind(this);
    this.ValidateSourceTarget = this.ValidateSourceTarget.bind(this);
    this.OfferToCreateNewNode = this.OfferToCreateNewNode.bind(this);
    this.CreateNode = this.CreateNode.bind(this);
    this.BackToEditing = this.BackToEditing.bind(this);
    this.SetSourceTarget = this.SetSourceTarget.bind(this);
    this.ThenSaveSourceTarget = this.ThenSaveSourceTarget.bind(this);
    // DATA SAVING
    this.SaveEdge = this.SaveEdge.bind(this);
    // HELPER METHODS
    this.setBackgroundColor = this.setBackgroundColor.bind(this);
    this.SetSourceTargetNodeColor = this.SetSourceTargetNodeColor.bind(this);
    this.SwapSourceAndTarget = this.SwapSourceAndTarget.bind(this);
    // UI MANIPULATION METHODS
    this.EnableEditMode = this.EnableEditMode.bind(this);
    // UI EVENT HANDLERS
    this.uiSelectTab = this.uiSelectTab.bind(this);
    this.uiRequestEditEdge = this.uiRequestEditEdge.bind(this);
    this.uiDeselectEdge = this.uiDeselectEdge.bind(this);
    this.uiCancelEditMode = this.uiCancelEditMode.bind(this);
    this.uiDisableEditMode = this.uiDisableEditMode.bind(this);
    this.uiInputUpdate = this.uiInputUpdate.bind(this);
    this.UIEnableSourceTargetSelect = this.UIEnableSourceTargetSelect.bind(this);
    this.UISourceTargetInputUpdate = this.UISourceTargetInputUpdate.bind(this);
    this.UISourceTargetInputSelect = this.UISourceTargetInputSelect.bind(this);
    // RENDERERS -- Main
    this.RenderView = this.RenderView.bind(this);
    this.RenderEdit = this.RenderEdit.bind(this);
    // FORM RENDERERS
    this.RenderSourceTargetButton = this.RenderSourceTargetButton.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// REGISTER LISTENERS
    UDATA.OnAppStateChange('SESSION', this.updateSession);
    UDATA.OnAppStateChange('SELECTION', this.updateSelection);
    UDATA.HandleMessage('EDGE_OPEN', this.reqLoadEdge);
    UDATA.HandleMessage('EDGE_DESELECT', this.clearSelection);
    UDATA.HandleMessage('EDIT_PERMISSIONS_UPDATE', this.setPermissions);
    UDATA.HandleMessage('EDGE_EDIT', this.editEdge); // EdgeTable request
    UDATA.HandleMessage('SELECT_SOURCETARGET', this.SetSourceTarget);
  }

  componentDidMount() {
    this.resetState(); // Initialize State

    const { edge } = this.props;
    this.loadEdge(edge);

    window.addEventListener('beforeunload', this.checkUnload);
    window.addEventListener('unload', this.doUnload);
  }
  componentWillUnmount() {
    UDATA.AppStateChangeOff('SESSION', this.updateSession);
    UDATA.AppStateChangeOff('SELECTION', this.updateSelection);
    UDATA.UnhandleMessage('EDGE_OPEN', this.reqLoadEdge);
    UDATA.UnhandleMessage('EDGE_DESELECT', this.clearSelection);
    UDATA.UnhandleMessage('EDIT_PERMISSIONS_UPDATE', this.setPermissions);
    UDATA.UnhandleMessage('EDGE_EDIT', this.editEdge);
    UDATA.UnhandleMessage('SELECT_SOURCETARGET', this.SetSourceTarget);
    window.removeEventListener('beforeunload', this.checkUnload);
    window.removeEventListener('unload', this.doUnload);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// STATE MANAGEMENT
  ///
  resetState() {
    this.setState({
      // EDGE DEFS 'core state data'
      id: null,
      // source: null, // avoid ambiguous keys, use sourceId instead
      // target: null, // avoid ambiguous keys, use targetId instead
      sourceId: null,
      targetId: null,
      attributes: [],
      provenance: [],
      // created: undefined,
      // updated: undefined,
      // revision: 0

      // SYSTEM STATE
      // isLoggedIn: false, // don't clear session state!
      // previousState: {},

      // UI State 'u'
      uEditBtnDisable: false,
      uEditBtnHide: false,
      uViewMode: NCUI.VIEWMODE.VIEW,
      uSelectedTab: TABS.ATTRIBUTES,
      uSelectSourceTarget: undefined,
      uBackgroundColor: '#ccc', // edge component bgcolor determined by type/COLORMAP
      uIsLockedByDB: false, // shows db lock message next to Edit Node button
      uIsLockedByTemplate: false,
      uIsLockedByImport: false,
      uEditLockMessage: '',
      uNewNodeKey: undefined,
      uNewNodeLabel: undefined,

      // DERIVED VALUES 'd'
      dSourceNode: undefined,
      dSourceNodeColor: null,
      dTargetNode: undefined,
      dTargetNodeColor: null
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// SYSTEM/NETWORK EVENT HANDLERS
  ///
  checkUnload(event) {
    event.preventDefault();
    if (this.state.uViewMode === NCUI.VIEWMODE.EDIT) {
      (event || window.event).returnValue = null;
    } else {
      Reflect.deleteProperty(event, 'returnValue');
    }
    return event;
  }
  doUnload(event) {
    if (this.state.uViewMode === NCUI.VIEWMODE.EDIT) {
      UDATA.NetCall('SRV_DBUNLOCKEDGE', { edgeID: this.state.id });
      UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.EDGE });
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
  updateSession(decoded) {
    this.setState({ isLoggedIn: decoded.isValid }, () => this.updatePermissions());
  }
  /**
   * Checks current SESSION state to see if user is logged in.
   * Since NCEdge is dynamically created and closed, we can't rely on
   * SESSION AppState updates messages.
   * NOTE updates state.
   * @returns {boolean} True if user is logged in
   */
  isLoggedIn() {
    const SESSION = UDATA.AppState('SESSION');
    const isLoggedIn = SESSION.isValid;
    this.setState({ isLoggedIn });
    return isLoggedIn;
  }
  setPermissions(data) {
    const { id } = this.state;
    const edgeIsLocked = data.lockedEdges.includes(id);
    this.setState(
      {
        uIsLockedByDB: edgeIsLocked,
        uIsLockedByTemplate: data.templateBeingEdited,
        uIsLockedByImport: data.importActive
      },
      () => this.updatePermissions()
    );
  }
  updatePermissions() {
    const { uIsLockedByDB, uIsLockedByTemplate, uIsLockedByImport } = this.state;
    const isLoggedIn = this.isLoggedIn();
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    let uEditLockMessage = '';
    let uEditBtnDisable = false;
    let uEditBtnHide = true;
    if (isLoggedIn) uEditBtnHide = false;
    if (uIsLockedByDB) {
      uEditBtnDisable = true;
      uEditLockMessage += TEMPLATE.edgeIsLockedMessage;
    }
    if (uIsLockedByTemplate) {
      uEditBtnDisable = true;
      uEditLockMessage += TEMPLATE.templateIsLockedMessage;
    }
    if (uIsLockedByImport) {
      uEditBtnDisable = true;
      uEditLockMessage += TEMPLATE.importIsLockedMessage;
    }
    this.setState({ uEditBtnDisable, uEditBtnHide, uEditLockMessage });
  }
  clearSelection() {
    this.resetState();
  }
  updateSelection(data) {
    const { sourceTargetSelect } = this.state;
    const selectedNode = data.nodes[0]; // select the first node
    if (sourceTargetSelect === 'source') {
      this.setState({
        sourceId: selectedNode.id,
        dSourceNode: selectedNode
      });
    } else if (sourceTargetSelect === 'target') {
      this.setState({
        targetId: selectedNode.id,
        dTargetNode: selectedNode
      });
    } else {
      // ignore the selection
    }
  }
  reqLoadEdge(data) {
    // handler for UDATA call, interprets the net `data`
    this.loadEdge(data.edge);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA LOADING
  ///
  loadEdge(edge) {
    const { uViewMode } = this.state;

    // If we're editing, ignore the select!
    if (uViewMode === NCUI.VIEWMODE.EDIT) return;

    // If no edge was selected, deselect
    if (!edge) {
      this.clearSelection();
      return;
    }

    // Load the edge
    const attributes = this.loadAttributes(edge);
    this.setState(
      {
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        attributes: attributes
        // provenance: edge.provenance,
        // created: edge.created,
        // updated: edge.updated,
        // revision: edge.revision
      },
      () => this.UpdateDerivedValues()
    );
  }
  /**
   * Loads up the `attributes` object defined by the TEMPLATE
   * Will skip
   *   * BUILTIN fields
   *   * attributes that are `hidden` by the template
   * REVIEW: Currently the parameters will show up in random object order.
   * @param {Object} edge
   * @returns {Object} { ...attr-key: attr-value }
   */
  loadAttributes(edge) {
    const EDGEDEFS = UDATA.AppState('TEMPLATE').edgeDefs;
    const attributes = {};
    Object.keys(EDGEDEFS).forEach(k => {
      if (BUILTIN_FIELDS.includes(k)) return; // skip built-in fields
      const attr_def = EDGEDEFS[k];
      if (attr_def.hidden) return; // skip hidden fields
      attributes[k] = edge[k];
    });
    return attributes;
  }

  /**
   * Tries to lock the edge for editing.
   * If the lock fails, then it means the edge was already locked
   * previously and we're not allowed to edit
   * @param {function} cb callback function
   * @returns {boolean} true if lock was successful
   */
  lockEdge(cb) {
    const { id } = this.state;
    let lockSuccess = false;
    UDATA.NetCall('SRV_DBLOCKEDGE', { edgeID: id }).then(data => {
      if (data.NOP) {
        console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
      } else if (data.locked) {
        console.log(`SERVER SAYS: lock success! you can edit Edge ${data.edgeID}`);
        console.log(`SERVER SAYS: unlock the edge after successful DBUPDATE`);
        lockSuccess = true;
        // When a edge is being edited, lock the Template from being edited
        UDATA.NetCall('SRV_REQ_EDIT_LOCK', { editor: EDITORTYPE.EDGE });
      }
      if (typeof cb === 'function') cb(lockSuccess);
    });
  }
  /**
   * Returns whether the unlock is successful
   * @param {function} cb Callback function to handle cleanup after unlock
   */
  UnlockEdge(cb) {
    const { id } = this.state;
    let unlockSuccess = false;
    UDATA.NetCall('SRV_DBUNLOCKEDGE', { edgeID: id }).then(data => {
      if (data.NOP) {
        console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
      } else if (data.unlocked) {
        console.log(
          `SERVER SAYS: unlock success! you have released Edge ${data.edgeID}`
        );
        unlockSuccess = true;
        // Release Template lock
        UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.EDGE });
      }
      if (typeof cb === 'function') cb(unlockSuccess);
    });
  }
  isEdgeLocked(cb) {
    const { id } = this.state;
    let edgeIsLocked = false;
    UDATA.NetCall('SRV_DBISEDGELOCKED', { edgeID: id }).then(data => {
      if (data.NOP) {
        // ISSUE Server will return error can't lock if the edge
        // hadn't been created yet.
        // do we skip the lock here?
        console.log(`SERVER SAYS: ${data.NOP} ${data.INFO}`);
      } else if (data.locked) {
        console.log(
          `SERVER SAYS: Edge is locked! You cannot edit Edge ${data.edgeID}`
        );
        edgeIsLocked = true;
      }
      if (typeof cb === 'function') cb(edgeIsLocked);
    });
  }
  /**
   * If `lockEdge` is not successful, then that means the edge was
   * already locked, so we can't edit.
   */
  editEdge() {
    this.lockEdge(lockSuccess => {
      this.setState({ uIsLockedByDB: !lockSuccess }, () => {
        if (lockSuccess) this.EnableEditMode();
      });
    });
  }

  /**
   * After loading or updating edge core parameters, run this to
   * load and update any derived values.
   */
  UpdateDerivedValues() {
    const { sourceId, targetId } = this.state;
    // Look up source/target nodes
    const NCDATA = UDATA.AppState('NCDATA');
    const dSourceNode = NCDATA.nodes.find(n => n.id === sourceId) || {
      label: EDGE_NOT_SET_LABEL
    };
    const dTargetNode = NCDATA.nodes.find(n => n.id === targetId) || {
      label: EDGE_NOT_SET_LABEL
    };
    this.setState(
      {
        dSourceNode,
        dTargetNode
      },
      () => {
        this.setBackgroundColor();
        this.SetSourceTargetNodeColor();
        // setTimeout(() => {
        this.setState({ animateHeight: 'fullheight' }); // animate transition
        // }, 500);
        this.isEdgeLocked(edgeIsLocked => {
          this.setState({ uIsLockedByDB: edgeIsLocked }, () =>
            this.updatePermissions()
          );
        });
      }
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// SET SOURCE / TARGET
  ///
  /// Selecting a source or target node is a multi-step process.
  /// 1. First, you need to Enable editing
  /// 2. Then, you need to click on a Source or Target node to activate
  ///    the source or target for selection
  /// 3. Once you enable source or target editing, you need to decide
  ///    how you want to select the node...
  ///    A. Click on the node on the d3 graph to select the node, or...
  ///    B. Type the full node name, or...
  ///    C. Type a partial name, and..
  ///       and arrow up/down to highlight
  ///       and hit Enter to select
  ///       or click name to select
  ///    D. Type a new node name and
  ///       and hit Enter to add a new node
  ///       and show dialog confirm creating a new node
  /// 5. Click "Save" to exit edit mode
  ///
  /**
   * User has selected a new source or target
   * validate it to make sure it exists
   * if it doesn't, offer to create a new one
   * @param {string} key 'source' or 'target'
   * @param {string} value
   * @param {number} id
   */
  ValidateSourceTarget(key, value, id) {
    // if we have an id, then the selected source/target is an existing node
    // but we should probably validate it anyway?
    if (id) {
      // find node by 'id'
      UDATA.LocalCall('FIND_NODE_BY_PROP', {
        key: 'id',
        searchString: id
      }).then(data => {
        if (data.nodes.length > 0) {
          const node = data.nodes[0];
          this.ThenSaveSourceTarget(key, node);
        } else {
          this.OfferToCreateNewNode(key, value);
        }
      });
    } else {
      // find node by 'label'
      UDATA.LocalCall('FIND_NODE_BY_PROP', {
        key: 'label',
        searchString: value
      }).then(data => {
        if (data.nodes.length > 0) {
          const node = data.nodes[0];
          this.ThenSaveSourceTarget(key, node);
        } else {
          this.OfferToCreateNewNode(key, value);
        }
      });
    }
  }
  /**
   * User has input a new node name that doesn't match an existing node
   * so offer to create a new node
   * @param {string} key 'source' or 'target'
   * @param {string} value
   */
  OfferToCreateNewNode(key, value) {
    this.setState({
      uNewNodeKey: key,
      uNewNodeLabel: value
    });
  }
  /**
   * NCDialog offer to create a new node -- user decided to create a new
   * new node, so add it.
   */
  CreateNode() {
    const { uNewNodeKey, uNewNodeLabel } = this.state;
    UDATA.LocalCall('NODE_CREATE', { label: uNewNodeLabel }).then(node => {
      this.setState({ uNewNodeKey: undefined, uNewNodeLabel: undefined }, () =>
        this.ThenSaveSourceTarget(uNewNodeKey, node)
      );
    });
  }
  /**
   * NCDialog offer to create a new node -- user clicked Cancel so
   * go back to editing the node
   */
  BackToEditing() {
    this.setState({ uNewNodeKey: undefined, uNewNodeLabel: undefined });
  }
  /**
   * User has selected a source or target node by clicking on D3 graph
   * Called by Selection Manager via SELECT_SOURCETARGET
   * @param {Object} data
   * @param {Object} data.node
   */
  SetSourceTarget(data) {
    const { uSelectSourceTarget } = this.state;

    // The source/target has been set already, so return to edge edit mode
    UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'edge_edit' });

    // Clear the secondary selection
    UDATA.LocalCall('SELECTMGR_DESELECT_SECONDARY');

    this.ThenSaveSourceTarget(uSelectSourceTarget, data.node);
  }
  /**
   * Save the source or target after either creating new node or selecting
   * an existing ndoe.
   * Runs after validateSourceTarget
   * @param {string} key 'source' or 'target'
   * @param {Object} node {id, label}
   */
  ThenSaveSourceTarget(key, node) {
    // MUST save sourceId or targetId to determine source/target
    // but ideally set all three?  because that's what loadEdge does?
    const state = {
      uSelectSourceTarget: undefined,
      uNewNodeKey: undefined, // clear NCDialog
      uNewNodeLabel: undefined // clear NCDialog
    };
    if (key === 'source') {
      state.sourceId = node.id;
    } else {
      // 'target'
      state.targetId = node.id;
    }
    this.setState(state, () => this.UpdateDerivedValues());
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA SAVING
  ///
  SaveEdge() {
    const { id, sourceId, targetId, attributes, provenance } = this.state;
    const edge = {
      id,
      source: sourceId,
      target: targetId,
      provenance
    };
    Object.keys(attributes).forEach(k => (edge[k] = attributes[k]));
    this.AppCall('DB_UPDATE', { edge }).then(() => {
      this.UnlockEdge(() => {
        // Clear the secondary selection
        UDATA.LocalCall('SELECTMGR_DESELECT_SECONDARY');

        UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'normal' });
        this.setState({
          uViewMode: NCUI.VIEWMODE.VIEW,
          uIsLockedByDB: false,
          uSelectSourceTarget: undefined
        });
      });
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// HELPER METHODS
  ///
  /**
   * Sets the background color of the node editor via `uBackgroundColor` state.
   * Currently the background color is determined by the template edge type
   * color mapping.  This will eventually be replaced with a color manager.
   */
  setBackgroundColor() {
    const { attributes } = this.state;
    const type = attributes && attributes.type;
    const COLORMAP = UDATA.AppState('COLORMAP');
    const uBackgroundColor = COLORMAP.edgeColorMap[type] || '#555555';
    this.setState({ uBackgroundColor });
  }
  SetSourceTargetNodeColor() {
    const { dSourceNode, dTargetNode } = this.state;
    const COLORMAP = UDATA.AppState('COLORMAP');
    const dSourceNodeColor =
      COLORMAP.nodeColorMap[dSourceNode ? dSourceNode.type : ''];
    const dTargetNodeColor =
      COLORMAP.nodeColorMap[dTargetNode ? dTargetNode.type : ''];
    this.setState({ dSourceNodeColor, dTargetNodeColor });
  }
  SwapSourceAndTarget() {
    const {
      sourceId,
      dSourceNode,
      dSourceNodeColor,
      targetId,
      dTargetNode,
      dTargetNodeColor
    } = this.state;

    // swap
    const swappedTargetId = sourceId;
    const swappedSourceId = targetId;
    const swappedTargetNode = dSourceNode;
    const swappedSourceNode = dTargetNode;
    const swappedTargetNodeColor = dSourceNodeColor;
    const swappedSourceNodeColor = dTargetNodeColor;

    this.setState({
      sourceId: swappedSourceId,
      dSourceNode: swappedSourceNode,
      dSourceNodeColor: swappedSourceNodeColor,
      targetId: swappedTargetId,
      dTargetNode: swappedTargetNode,
      dTargetNodeColor: swappedTargetNodeColor
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI MANIPULATION METHODS
  ///
  /**
   * Save `previousState` so that we can undo/restore data if user cancels
   */
  EnableEditMode() {
    const { uSelectedTab, sourceId, targetId, attributes, provenance } = this.state;
    const previousState = {
      sourceId,
      targetId,
      attributes: Object.assign({}, attributes)
      // provenance: Object.assign({}, provenance) // uncomment after provenence is implemented
    };
    this.setState({
      uViewMode: NCUI.VIEWMODE.EDIT,
      uSelectedTab,
      previousState
    });
    UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'edge_edit' });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS
  ///
  uiSelectTab(event) {
    event.stopPropagation();
    this.setState({ uSelectedTab: event.target.value });
  }

  uiRequestEditEdge(event) {
    event.stopPropagation();
    this.editEdge();
  }

  uiDeselectEdge() {
    UDATA.LocalCall('EDGE_DESELECT');
  }

  uiCancelEditMode() {
    const { previousState } = this.state;
    // restore previous state
    this.setState(
      {
        sourceId: previousState.sourceId,
        targetId: previousState.targetId,
        attributes: previousState.attributes,
        uSelectSourceTarget: undefined
        // provenance: Object.assign({}, provenance) // uncomment after provenence is implemented
      },
      () => {
        this.UpdateDerivedValues();
        this.uiDisableEditMode();
      }
    );
  }
  uiDisableEditMode() {
    this.UnlockEdge(() => {
      this.setState({
        uViewMode: NCUI.VIEWMODE.VIEW,
        uIsLockedByDB: false
      });

      // Clear the secondary selection
      UDATA.LocalCall('SELECTMGR_DESELECT_SECONDARY');

      UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'normal' });
      UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.EDGE });
    });
  }

  uiInputUpdate(key, value) {
    if (BUILTIN_FIELDS.includes(key)) {
      const data = {};
      data[key] = value;
      this.setState(data);
    } else {
      const { attributes } = this.state;
      attributes[key] = value;
      this.setState({ attributes }, () => this.setBackgroundColor());
    }
  }

  UIEnableSourceTargetSelect(event) {
    const key = event.target.id;
    this.setState({ uSelectSourceTarget: key });
    UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'sourcetarget' });
  }

  /**
   * Handles keystrokes as user inputs new node in form
   * @param {string} key
   * @param {string} value
   */
  UISourceTargetInputUpdate(key, value) {
    const updatedState = {};
    if (key === 'source') {
      updatedState.dSourceNode = { label: value };
    } else {
      updatedState.dTargetNode = { label: value };
    }
    this.setState(updatedState);
  }

  /**
   * User has selected a node with NCAutoSuggest, either
   * - Clicking on a suggested node
   * - Hitting Enter with the form field showing either a valid node or a new node
   * @param {string} key
   * @param {string} value
   */
  UISourceTargetInputSelect(key, value, id) {
    this.ValidateSourceTarget(key, value, id);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER METHODS
  RenderView() {
    const {
      uSelectedTab,
      uBackgroundColor,
      animateHeight,
      uEditBtnDisable,
      uEditBtnHide,
      uEditLockMessage,
      dSourceNode = { label: undefined },
      dTargetNode = { label: undefined }
    } = this.state;
    const bgcolor = uBackgroundColor + '66'; // hack opacity
    const defs = UDATA.AppState('TEMPLATE').edgeDefs;
    const disableSourceTargetInView = true;
    return (
      <div className={`nccomponent ncedge ${animateHeight}`}>
        <div
          className="view"
          style={{ backgroundColor: bgcolor }}
          onClick={this.uiDeselectEdge}
        >
          {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
          <div className="formview">
            {NCUI.RenderLabel('source', defs['source'].displayLabel)}
            {this.RenderSourceTargetButton(
              'source',
              dSourceNode.label,
              disableSourceTargetInView
            )}
            <div />
            <div className="targetarrow">{ARROW_DOWN}</div>
            {NCUI.RenderLabel('target', defs['target'].displayLabel)}
            {this.RenderSourceTargetButton(
              'target',
              dTargetNode.label,
              disableSourceTargetInView
            )}
          </div>
          {/* TABS - - - - - - - - - - - - - - - - - - - */}
          <div className="tabcontainer">
            {NCUI.RenderTabSelectors(TABS, this.state, this.uiSelectTab)}
            <div className="tabview">
              {uSelectedTab === TABS.ATTRIBUTES &&
                NCUI.RenderAttributesTabView(this.state, defs)}
              {uSelectedTab === TABS.PROVENANCE &&
                NCUI.RenderProvenanceTab(this.state, defs)}
            </div>
          </div>
          {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
          <div className="controlbar">
            {!uEditBtnHide && uSelectedTab !== TABS.EDGES && (
              <button
                id="editbtn"
                onClick={this.uiRequestEditEdge}
                disabled={uEditBtnDisable}
              >
                Edit
              </button>
            )}
          </div>
          {uEditLockMessage && (
            <div className="message warning">{uEditLockMessage}</div>
          )}
        </div>
      </div>
    );
  }

  RenderEdit() {
    const { parentNodeId } = this.props;
    const {
      sourceId,
      targetId,
      uSelectedTab,
      uSelectSourceTarget,
      uBackgroundColor,
      uNewNodeLabel,
      animateHeight,
      dSourceNode,
      dTargetNode
    } = this.state;
    const bgcolor = uBackgroundColor + '99'; // hack opacity
    const defs = UDATA.AppState('TEMPLATE').edgeDefs;
    const AskNodeDialog = uNewNodeLabel ? (
      <NCDialog
        message={`Node "${uNewNodeLabel}" does not exist.  Do you want to create it?`}
        okmessage={`Create "${uNewNodeLabel}" node`}
        onOK={this.CreateNode}
        cancelmessage="Back to Edge Edit"
        onCancel={this.BackToEditing}
      />
    ) : (
      ''
    );
    return (
      <div>
        <div className="screen"></div>
        <div className={`nccomponent ncedge ${animateHeight}`}>
          <div
            className="edit"
            style={{
              background: bgcolor,
              borderColor: uBackgroundColor
            }}
          >
            {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
            <div className="formview">
              {NCUI.RenderLabel('source', defs['source'].displayLabel)}
              {this.RenderSourceTargetButton(
                'source',
                dSourceNode.label,
                parentNodeId === sourceId
              )}
              <div />
              <div className="targetarrow">
                <button
                  className="swapbtn"
                  onClick={this.SwapSourceAndTarget}
                  title="Swap 'Source' and 'Target' nodes"
                >
                  {ARROW_UPDOWN}
                </button>
              </div>
              {NCUI.RenderLabel('target', defs['target'].displayLabel)}
              {this.RenderSourceTargetButton(
                'target',
                dTargetNode.label,
                parentNodeId === targetId
              )}
            </div>
            {/* TABS - - - - - - - - - - - - - - - - - - - */}
            <div className="tabcontainer">
              {NCUI.RenderTabSelectors(TABS, this.state, this.uiSelectTab)}
              <div className="tabview">
                {uSelectedTab === TABS.ATTRIBUTES &&
                  NCUI.RenderAttributesTabEdit(this.state, defs, this.uiInputUpdate)}
                {uSelectedTab === TABS.PROVENANCE &&
                  NCUI.RenderProvenanceTab(this.state, defs)}
              </div>
            </div>
            {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
            <div className="controlbar">
              <button className="cancelbtn" onClick={this.uiCancelEditMode}>
                Cancel
              </button>
              <button onClick={this.SaveEdge} disabled={uSelectSourceTarget}>
                Save
              </button>
            </div>
          </div>
        </div>
        {AskNodeDialog}
      </div>
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// FORM RENDERERS
  ///

  /**
   * The Source and Target Buttons are used for
   * - Displaying the source / target name in the view/edit panel
   * - Click on Source or Target to select a new one
   * - Showing a focus ring (outline) after having secondarily selected a source/target
   * @param {string} key
   * @param {string} value
   * @param {boolean} disabled Used by renderView to disable source/target selection buttons
   * @returns {jsx}
   */
  RenderSourceTargetButton(key, value, disabled) {
    const {
      sourceId,
      targetId,
      uSelectSourceTarget,
      dSourceNodeColor,
      dTargetNodeColor
    } = this.state;
    let color;
    if (!disabled && (uSelectSourceTarget === key || value === undefined)) {
      return (
        <NCAutoSuggest
          statekey={key}
          value={value}
          onChange={this.UISourceTargetInputUpdate}
          onSelect={this.UISourceTargetInputSelect}
        />
      );
    } else {
      color = key === 'source' ? dSourceNodeColor : dTargetNodeColor;
      // Ssecondary selection?
      const SELECTION = UDATA.AppState('SELECTION');
      let isSecondarySelection = false;
      if (key === 'source') {
        isSecondarySelection = SELECTION.selectedSecondary === sourceId;
      } else {
        // key === 'target'
        isSecondarySelection = SELECTION.selectedSecondary === targetId;
      }
      const selected = isSecondarySelection ? 'selected' : '';
      return (
        <div>
          <button
            id={key}
            key={`${key}value`}
            className={`sourcetargetbtn ${selected}`}
            onClick={this.UIEnableSourceTargetSelect}
            style={{ backgroundColor: color + '55', borderColor: color }}
            disabled={disabled}
          >
            {value}
          </button>
        </div>
      );
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// MAIN RENDER
  ///
  render() {
    const { id, uViewMode } = this.state;
    if (!id) return ''; // nothing selected
    if (uViewMode === NCUI.VIEWMODE.VIEW) {
      return this.RenderView();
    } else {
      return this.RenderEdit();
    }
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCEdge;
