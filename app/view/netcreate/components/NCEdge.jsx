/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Prototype Simple NetCreate Edge Editor

    Built for Version 2.0 ITEST.

    Provides a viewer and editor for the currently selected edge.

    USAGE

      <NCNEdge edge={edge}/>

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
const EDGEMGR = require('../edge-mgr'); // handles edge synthesis
const { EDITORTYPE } = require('system/util/enum');
const NCUI = require('../nc-ui');

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
export const TABS = {
  // Also used as labels
  ATTRIBUTES: 'ATTRIBUTES',
  PROVENANCE: 'PROVENANCE'
};

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
    this.unlockEdge = this.unlockEdge.bind(this);
    this.isEdgeLocked = this.isEdgeLocked.bind(this);
    this.editEdge = this.editEdge.bind(this);
    this.saveEdge = this.saveEdge.bind(this);
    // HELPER METHODS
    this.setBackgroundColor = this.setBackgroundColor.bind(this);
    // UI HANDLERS
    this.uiSelectTab = this.uiSelectTab.bind(this);
    this.uiRequestEditEdge = this.uiRequestEditEdge.bind(this);
    this.uiDeselectEdge = this.uiDeselectEdge.bind(this);
    this.enableEditMode = this.enableEditMode.bind(this);
    this.uiCancelEditMode = this.uiCancelEditMode.bind(this);
    this.uiDisableEditMode = this.uiDisableEditMode.bind(this);
    this.uiInputUpdate = this.uiInputUpdate.bind(this);
    // RENDERERS -- Main
    this.renderView = this.renderView.bind(this);
    this.renderEdit = this.renderEdit.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// REGISTER LISTENERS
    UDATA.OnAppStateChange('SELECTION', this.updateSelection);
    UDATA.HandleMessage('EDGE_OPEN', this.reqLoadEdge);
    UDATA.HandleMessage('EDGE_DESELECT', this.clearSelection);
    UDATA.HandleMessage('EDIT_PERMISSIONS_UPDATE', this.setPermissions);
    UDATA.HandleMessage('EDGE_EDIT', this.editEdge); // EdgeTable request
  }

  componentDidMount() {
    this.resetState(); // Initialize State

    const { edge } = this.props;
    this.loadEdge(edge);

    window.addEventListener('beforeunload', this.checkUnload);
    window.addEventListener('unload', this.doUnload);
  }
  componentWillUnmount() {
    UDATA.AppStateChangeOff('SELECTION', this.updateSelection);
    UDATA.UnhandleMessage('EDGE_OPEN', this.reqLoadEdge);
    UDATA.UnhandleMessage('EDGE_DESELECT', this.clearSelection);
    UDATA.UnhandleMessage('EDIT_PERMISSIONS_UPDATE', this.setPermissions);
    UDATA.UnhandleMessage('EDGE_EDIT', this.editEdge);
    window.removeEventListener('beforeunload', this.checkUnload);
    window.removeEventListener('unload', this.doUnload);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// STATE MANAGEMENT
  ///
  resetState() {
    this.setState({
      // SYSTEM STATE
      // isLoggedIn: false, // don't clear session state!
      // previousState: {},
      // // UI State
      editBtnDisable: false,
      editBtnHide: false,
      viewMode: NCUI.VIEWMODE.VIEW,
      selectedTab: TABS.ATTRIBUTES,
      // backgroundColor: 'transparent',
      isLockedByDB: false, // shows db lock message next to Edit Node button
      isLockedByTemplate: false,
      isLockedByImport: false,
      editLockMessage: '',
      // EDGE DEFS
      id: null,
      source: null,
      target: null,
      sourceId: null,
      targetId: null,
      sourceNode: undefined,
      targetNode: undefined,
      attributes: [],
      provenance: []
      // created: undefined,
      // updated: undefined,
      // revision: 0
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// EVENT HANDLERS
  ///
  checkUnload(event) {
    event.preventDefault();
    if (this.state.viewMode === NCUI.VIEWMODE.EDIT) {
      (event || window.event).returnValue = null;
    } else {
      Reflect.deleteProperty(event, 'returnValue');
    }
    return event;
  }
  doUnload(event) {
    if (this.state.viewMode === NCUI.VIEWMODE.EDIT) {
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
        isLockedByDB: edgeIsLocked,
        isLockedByTemplate: data.templateBeingEdited,
        isLockedByImport: data.importActive
      },
      () => this.updatePermissions()
    );
  }
  updatePermissions() {
    const { isLockedByDB, isLockedByTemplate, isLockedByImport } = this.state;
    const isLoggedIn = this.isLoggedIn();
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    let editLockMessage = '';
    let editBtnDisable = false;
    let editBtnHide = true;
    if (isLoggedIn) editBtnHide = false;
    if (isLockedByDB) {
      editBtnDisable = true;
      editLockMessage += TEMPLATE.edgeIsLockedMessage;
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
  clearSelection() {
    this.resetState();
  }
  updateSelection(data) {
    // const edge = data.edges[0]; // select the first node
    // this.loadEdge(edge);
  }
  reqLoadEdge(data) {
    // handler for UDATA call, interprets the net `data`
    this.loadEdge(data.edge);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA LOADING
  ///
  loadEdge(edge) {
    const { viewMode } = this.state;

    // If we're editing, ignore the select!
    if (viewMode === NCUI.VIEWMODE.EDIT) return;

    // If no edge was selected, deselect
    if (!edge) {
      this.clearSelection();
      return;
    }

    // Look up source/target nodes
    const NCDATA = UDATA.AppState('NCDATA');
    const sourceNode = NCDATA.nodes.find(n => n.id === edge.source);
    const targetNode = NCDATA.nodes.find(n => n.id === edge.target);

    // Load the edge
    const attributes = this.loadAttributes(edge);
    this.setState(
      {
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        attributes: attributes,
        // provenance: edge.provenance,
        sourceNode,
        targetNode
        // created: edge.created,
        // updated: edge.updated,
        // revision: edge.revision
      },
      () => {
        this.setBackgroundColor();
        // setTimeout(() => {
        this.setState({ animateHeight: 'fullheight' }); // animate transition
        // }, 500);
        this.isEdgeLocked(edgeIsLocked => {
          this.setState({ isLockedByDB: edgeIsLocked }, () =>
            this.updatePermissions()
          );
        });
      }
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
  unlockEdge(cb) {
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
      this.setState({ isLockedByDB: !lockSuccess }, () => {
        if (lockSuccess) this.enableEditMode();
      });
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA SAVING
  ///
  saveEdge() {
    const { id, sourceId, targetId, attributes, provenance } = this.state;

    const edge = { id, sourceId, targetId, provenance };
    Object.keys(attributes).forEach(k => (edge[k] = attributes[k]));

    this.AppCall('DB_UPDATE', { edge }).then(() => {
      this.unlockEdge(() => {
        this.setState({
          viewMode: NCUI.VIEWMODE.VIEW,
          isLockedByDB: false
        });
      });
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// HELPER METHODS
  ///
  /**
   * Sets the background color of the node editor via `backgroundColor` state.
   * Currently the background color is determined by the template edge type
   * color mapping.  This will eventually be replaced with a color manager.
   */
  setBackgroundColor() {
    const { attributes } = this.state;
    const type = attributes ? attributes.type : ''; // "" matches undefined
    const COLORMAP = UDATA.AppState('COLORMAP');
    this.setState({ backgroundColor: COLORMAP.edgeColorMap[type] });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS
  ///
  uiSelectTab(event) {
    this.setState({ selectedTab: event.target.value });
  }

  uiRequestEditEdge(event) {
    event.stopPropagation();
    this.editEdge();
  }

  uiDeselectEdge() {
    UDATA.LocalCall('EDGE_DESELECT');
  }

  enableEditMode() {
    const { selectedTab, sourceId, targetId, attributes, provenance } = this.state;
    const previousState = {
      sourceId,
      targetId,
      attributes: Object.assign({}, attributes)
      // provenance: Object.assign({}, provenance) // uncomment after provenence is implemented
    };
    this.setState({
      viewMode: NCUI.VIEWMODE.EDIT,
      selectedTab,
      previousState
    });
  }
  uiCancelEditMode() {
    const { previousState } = this.state;
    // restore previous state
    this.setState(
      {
        sourceId: previousState.sourceId,
        targetId: previousState.targetId,
        attributes: previousState.attributes
        // provenance: Object.assign({}, provenance) // uncomment after provenence is implemented
      },
      () => this.uiDisableEditMode()
    );
  }
  uiDisableEditMode() {
    this.unlockEdge(() => {
      this.setState({
        viewMode: NCUI.VIEWMODE.VIEW,
        isLockedByDB: false
      });
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER METHODS
  renderView() {
    const {
      selectedTab,
      backgroundColor,
      animateHeight,
      editBtnDisable,
      editBtnHide,
      editLockMessage,
      sourceNode,
      targetNode
    } = this.state;
    const bgcolor = backgroundColor + '44'; // hack opacity
    const label = sourceNode.label + ' \u2794 ' + targetNode.label;
    const defs = UDATA.AppState('TEMPLATE').edgeDefs;

    return (
      <div className={`nccomponent ncedge ${animateHeight}`}>
        <div
          className="view"
          style={{ background: bgcolor }}
          onClick={this.uiDeselectEdge}
        >
          {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
          <div className="nodelabel">{NCUI.RenderStringValue('label', label)}</div>
          <div className="formview">
            {NCUI.RenderLabel('source', defs['source'].displayLabel)}
            {NCUI.RenderStringValue('source', sourceNode.label)}
            {NCUI.RenderLabel('target', defs['target'].displayLabel)}
            {NCUI.RenderStringValue('target', targetNode.label)}
          </div>
          {/* TABS - - - - - - - - - - - - - - - - - - - */}
          <div className="tabcontainer">
            {NCUI.RenderTabSelectors(TABS, this.state, this.uiSelectTab)}
            <div className="tabview">
              {selectedTab === TABS.ATTRIBUTES &&
                NCUI.RenderAttributesTabView(this.state, defs)}
              {selectedTab === TABS.PROVENANCE &&
                NCUI.RenderProvenanceTab(this.state, defs)}
            </div>
          </div>
          {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
          <div className="controlbar">
            {!editBtnHide && selectedTab !== TABS.EDGES && (
              <button
                id="editbtn"
                onClick={this.uiRequestEditEdge}
                disabled={editBtnDisable}
              >
                Edit
              </button>
            )}
          </div>
          {editLockMessage && (
            <div className="message warning">{editLockMessage}</div>
          )}
        </div>
      </div>
    );
  }

  renderEdit() {
    const {
      selectedTab,
      backgroundColor,
      animateHeight,
      editBtnDisable,
      editBtnHide,
      editLockMessage,
      sourceNode,
      targetNode
    } = this.state;
    const label = sourceNode.label + ' \u2794 ' + targetNode.label;
    const bgcolor = backgroundColor + '66'; // hack opacity
    const defs = UDATA.AppState('TEMPLATE').edgeDefs;
    // const matchList = matchingNodeLabels
    //   ? matchingNodeLabels.map(l => <div key={l}>{l}</div>)
    //   : undefined;
    // console.log(
    //   'matchlist',
    //   label,
    //   matchingNodeLabels && matchingNodeLabels.includes(label),
    //   matchList,
    //   matchingNodeLabels
    // );
    return (
      <div>
        <div className="screen"></div>
        <div className={`nccomponent ncedge ${animateHeight}`}>
          <div
            className="edit"
            style={{
              background: bgcolor,
              borderColor: backgroundColor
            }}
          >
            {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
            <div className="nodelabel">{NCUI.RenderStringValue('label', label)}</div>
            {/* {matchList && <div className="matchlist">{matchList}</div>} */}
            {/* TABS - - - - - - - - - - - - - - - - - - - */}
            <div className="tabcontainer">
              {NCUI.RenderTabSelectors(TABS, this.state, this.uiSelectTab)}
              <div className="tabview">
                {selectedTab === TABS.ATTRIBUTES &&
                  NCUI.RenderAttributesTabEdit(this.state, defs, this.uiInputUpdate)}
                {selectedTab === TABS.PROVENANCE &&
                  NCUI.RenderProvenanceTab(this.state, defs)}
              </div>
            </div>
            {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
            <div className="controlbar">
              <button className="cancelbtn" onClick={this.uiCancelEditMode}>
                Cancel
              </button>
              <button onClick={this.saveEdge}>Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// MAIN RENDER
  render() {
    const { id, viewMode } = this.state;
    if (!id) return ''; // nothing selected
    if (viewMode === NCUI.VIEWMODE.VIEW) {
      return this.renderView();
    } else {
      return this.renderEdit();
    }
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCEdge;
