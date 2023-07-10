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

const DBG = false;
const PR = 'NCNode';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UNISYS = require('unisys/client');
const EDGEMGR = require('../edge-mgr'); // handles edge synthesis
const { EDITORTYPE } = require('system/util/enum');
const NCEdge = require('./NCEdge');

let UDATA;
const BUILTIN_FIELDS = [
  'id',
  'label',
  'provenance',
  'degrees',
  'created',
  'updated',
  'revision'
];
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
    this.resetState = this.resetState.bind(this);
    this.updateSession = this.updateSession.bind(this);
    this.setPermissions = this.setPermissions.bind(this);
    this.updatePermissions = this.updatePermissions.bind(this);

    // EVENT HANDLERS
    this.checkUnload = this.checkUnload.bind(this);
    this.doUnload = this.doUnload.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.selectEdgeAndEdit = this.selectEdgeAndEdit.bind(this);
    this.deselectEdge = this.deselectEdge.bind(this);
    // DATA LOADING
    this.loadNode = this.loadNode.bind(this);
    this.loadEdges = this.loadEdges.bind(this);
    this.loadAttributes = this.loadAttributes.bind(this);
    this.lockNode = this.lockNode.bind(this);
    this.unlockNode = this.unlockNode.bind(this);
    this.isNodeLocked = this.isNodeLocked.bind(this);
    this.saveNode = this.saveNode.bind(this);
    // HELPER METHODS
    this.setBackgroundColor = this.setBackgroundColor.bind(this);
    // UI HANDLERS
    this.uiSelectTab = this.uiSelectTab.bind(this);
    this.uiRequestEditNode = this.uiRequestEditNode.bind(this);
    this.enableEditMode = this.enableEditMode.bind(this);
    this.uiCancelEditMode = this.uiCancelEditMode.bind(this);
    this.uiDisableEditMode = this.uiDisableEditMode.bind(this);
    this.uiStringInputUpdate = this.uiStringInputUpdate.bind(this);
    this.uiLabelInputUpdate = this.uiLabelInputUpdate.bind(this);
    this.uiNumberInputUpdate = this.uiNumberInputUpdate.bind(this);
    this.uiSelectInputUpdate = this.uiSelectInputUpdate.bind(this);
    this.uiViewEdge = this.uiViewEdge.bind(this);
    // RENDERERS -- Main
    this.renderView = this.renderView.bind(this);
    this.renderEdit = this.renderEdit.bind(this);
    // RENDER HELPERS
    this.renderTabSelectors = this.renderTabSelectors.bind(this);
    this.renderAttributesTabView = this.renderAttributesTabView.bind(this);
    this.renderAttributesTabEdit = this.renderAttributesTabEdit.bind(this);
    this.renderEdgesTab = this.renderEdgesTab.bind(this);
    this.renderProvenanceTab = this.renderProvenanceTab.bind(this);
    this.renderLabel = this.renderLabel.bind(this);
    this.renderStringValue = this.renderStringValue.bind(this);
    this.renderStringInput = this.renderStringInput.bind(this);
    this.renderLabelInput = this.renderLabelInput.bind(this);
    this.renderNumberInput = this.renderNumberInput.bind(this);
    this.renderOptionsInput = this.renderOptionsInput.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// REGISTER LISTENERS
    UDATA.OnAppStateChange('SESSION', this.updateSession);
    UDATA.OnAppStateChange('SELECTION', this.updateSelection);
    UDATA.HandleMessage('EDIT_PERMISSIONS_UPDATE', this.setPermissions);
    UDATA.HandleMessage('NODE_EDIT', this.uiRequestEditNode); // Node Table request
    UDATA.HandleMessage('EDGE_SELECT_AND_EDIT', this.selectEdgeAndEdit);
    UDATA.HandleMessage('EDGE_DESELECT', this.deselectEdge);
  }

  componentDidMount() {
    this.resetState(); // Initialize State
    window.addEventListener('beforeunload', this.checkUnload);
    window.addEventListener('unload', this.doUnload);
  }
  componentWillUnmount() {
    UDATA.AppStateChangeOff('SESSION', this.updateSession);
    UDATA.AppStateChangeOff('SELECTION', this.updateSelection);
    UDATA.UnhandleMessage('EDIT_PERMISSIONS_UPDATE', this.setPermissions);
    UDATA.UnhandleMessage('NODE_EDIT', this.uiRequestEditNode);
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
      previousState: {},
      // UI State
      editBtnDisable: false,
      editBtnHide: false,
      viewMode: VIEWMODE.VIEW,
      selectedTab: TABS.ATTRIBUTES,
      selectedEdgeId: null,
      backgroundColor: 'transparent',
      isLockedByDB: false, // shows db lock message next to Edit Node button
      isLockedByTemplate: false,
      isLockedByImport: false,
      editLockMessage: '',
      // NODE DEFS
      id: null,
      label: '',
      attributes: [],
      provenance: [],
      created: undefined,
      updated: undefined,
      revision: 0,
      // EDGES
      edges: []
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// EVENT HANDLERS
  ///
  checkUnload(event) {
    event.preventDefault();
    if (this.state.viewMode === VIEWMODE.EDIT) {
      (event || window.event).returnValue = null;
    } else {
      Reflect.deleteProperty(event, 'returnValue');
    }
    return event;
  }
  doUnload(event) {
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
  updateSession(decoded) {
    this.setState({ isLoggedIn: decoded.isValid });
  }
  setPermissions(data) {
    const { id } = this.state;
    const nodeIsLocked = data.lockedNodes.includes(id);
    this.setState(
      {
        isLockedByDB: nodeIsLocked,
        isLockedByTemplate: data.templateBeingEdited,
        isLockedByImport: data.importActive
      },
      () => this.updatePermissions()
    );
  }
  updatePermissions() {
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
  clearSelection() {
    this.resetState();
  }
  updateSelection(data) {
    const node = data.nodes[0]; // select the first node
    this.loadNode(node);
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
  selectEdgeAndEdit(data) {
    const { edgeId } = data;
    this.setState({ selectedTab: TABS.EDGES, selectedEdgeId: edgeId }, () => {
      const { edges } = this.state;
      const edge = edges.find(e => e.id === Number(edgeId));
      this.setState({ selectedEdgeId: edgeId });
      UDATA.LocalCall('EDGE_OPEN', { edge }).then(() => {
        UDATA.LocalCall('EDGE_EDIT', { edgeId });
      });
    });
  }
  deselectEdge() {
    this.setState({ selectedEdgeId: null });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA LOADING
  ///
  loadNode(node) {
    const { viewMode } = this.state;

    // If we're editing, ignore the select!
    if (viewMode === VIEWMODE.EDIT) return;

    // close any open edges
    UDATA.LocalCall('EDGE_DESELECT');

    // If no node was selected, deselect
    if (!node) {
      this.clearSelection();
      return;
    }

    // Load the node
    const attributes = this.loadAttributes(node);
    this.setState(
      {
        id: node.id,
        label: node.label,
        attributes: attributes,
        provenance: node.provenance,
        created: node.created,
        updated: node.updated,
        revision: node.revision
      },
      () => {
        this.setBackgroundColor();
        this.loadEdges(node.id);
        this.isNodeLocked(nodeIsLocked => {
          this.setState(
            {
              isLockedByDB: nodeIsLocked
            },
            () => this.updatePermissions()
          );
        });
      }
    );
  }
  loadEdges(id) {
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
  loadAttributes(node) {
    const NODEDEFS = UDATA.AppState('TEMPLATE').nodeDefs;
    const attributes = {};
    Object.keys(NODEDEFS).forEach(k => {
      if (BUILTIN_FIELDS.includes(k)) return; // skip built-in fields
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
  lockNode(cb) {
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
  unlockNode(cb) {
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
  isNodeLocked(cb) {
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
  saveNode() {
    const { id, label, attributes, provenance, created, updated, revision } =
      this.state;

    const node = { id, label, provenance, created, updated, revision };
    Object.keys(attributes).forEach(k => (node[k] = attributes[k]));

    // write data to database
    // setting dbWrite to true will distinguish this update
    // from a remote one
    this.AppCall('DB_UPDATE', { node }).then(() => {
      this.unlockNode(() => {
        this.setState({
          viewMode: VIEWMODE.VIEW,
          isLockedByDB: false
        });
      });
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// HELPER METHODS
  /**
   * Sets the background color of the node editor via `backgroundColor` state.
   * Currently the background color is determined by the template node type
   * color mapping.  This will eventually be replaced with a color manager.
   */
  setBackgroundColor() {
    const { attributes } = this.state;
    const type = attributes ? attributes.type : ''; // "" matches undefined
    const COLORMAP = UDATA.AppState('COLORMAP');
    this.setState({ backgroundColor: COLORMAP.nodeColorMap[type] });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS

  uiSelectTab(event) {
    const selectedTab = event.target.value;
    this.setState({ selectedTab });
    if (event.target.value !== TABS.EDGES) UDATA.LocalCall('EDGE_DESELECT');
  }

  /**
   * If `lockNode` is not successful, then that means the node was
   * already locked, so we can't edit.
   */
  uiRequestEditNode() {
    this.lockNode(lockSuccess => {
      this.setState({ isLockedByDB: !lockSuccess }, () => {
        if (lockSuccess) this.enableEditMode();
      });
    });
  }

  enableEditMode() {
    const { selectedTab, label, attributes, provenance } = this.state;
    // If user was on Edges tab while requesting edit (e.g. from Node Table), then
    // switch to Attributes tab first.
    const editableTab = selectedTab === TABS.EDGES ? TABS.ATTRIBUTES : selectedTab;
    const previousState = {
      label,
      attributes: Object.assign({}, attributes)
      // provenance: Object.assign({}, provenance) // uncomment after provenence is implemented
    };
    this.setState({
      viewMode: VIEWMODE.EDIT,
      selectedTab: editableTab,
      previousState
    });
  }

  uiCancelEditMode() {
    const { previousState } = this.state;
    // restore previous state
    this.setState(
      {
        label: previousState.label,
        attributes: previousState.attributes
        // provenance: previousState.provenance // uncomment after provenence is implemented
      },
      () => this.uiDisableEditMode()
    );
  }

  uiDisableEditMode() {
    this.unlockNode(() => {
      this.setState({
        viewMode: VIEWMODE.VIEW,
        isLockedByDB: false
      });
      UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.NODE });
    });
  }

  uiStringInputUpdate(event) {
    const nodeDefKey = event.target.id;
    if (BUILTIN_FIELDS.includes(nodeDefKey)) {
      const data = {};
      data[nodeDefKey] = event.target.value;
      this.setState(data);
    } else {
      const { attributes } = this.state;
      attributes[nodeDefKey] = event.target.value;
      this.setState({ attributes }, () => this.setBackgroundColor());
    }
  }
  uiLabelInputUpdate(event) {
    const { id } = this.state;
    const nodeDefKey = event.target.id;
    const data = {};
    data[nodeDefKey] = event.target.value;
    this.setState(data);
    UDATA.LocalCall('FIND_MATCHING_NODES', { searchString: event.target.value }).then(
      data => {
        const foundLabels =
          data.nodes && data.nodes.length > 0
            ? data.nodes.map(d => d.label)
            : undefined;
        this.setState({ matchingNodeLabels: foundLabels });
      }
    );
  }
  uiNumberInputUpdate(event) {
    const nodeDefKey = event.target.id;
    if (BUILTIN_FIELDS.includes(nodeDefKey)) {
      const data = {};
      data[nodeDefKey] = Number(event.target.value);
      this.setState(data);
    } else {
      const { attributes } = this.state;
      attributes[nodeDefKey] = Number(event.target.value);
      this.setState({ attributes }, () => this.setBackgroundColor());
    }
  }
  uiSelectInputUpdate(event) {
    const nodeDefKey = event.target.id;
    if (BUILTIN_FIELDS.includes(nodeDefKey)) {
      const data = {};
      data[nodeDefKey] = event.target.value;
      this.setState(data);
    } else {
      const { attributes } = this.state;
      attributes[nodeDefKey] = event.target.value;
      this.setState({ attributes }, () => this.setBackgroundColor());
    }
  }

  uiViewEdge(edgeId) {
    const { edges } = this.state;
    const edge = edges.find(e => e.id === Number(edgeId));
    this.setState({ selectedEdgeId: edgeId });
    UDATA.LocalCall('EDGE_OPEN', { edge });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER METHODS
  renderView() {
    const {
      selectedTab,
      backgroundColor,
      editBtnDisable,
      editBtnHide,
      editLockMessage,
      label
    } = this.state;
    const bgcolor = backgroundColor + '44'; // hack opacity
    return (
      <div className="nccomponent">
        <div className="view" style={{ background: bgcolor }}>
          {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
          <div className="nodelabel">{this.renderStringValue('label', label)}</div>
          {/* TABS - - - - - - - - - - - - - - - - - - - */}
          <div className="tabcontainer">
            {this.renderTabSelectors()}
            <div className="tabview">
              {selectedTab === TABS.ATTRIBUTES && this.renderAttributesTabView()}
              {selectedTab === TABS.EDGES && this.renderEdgesTab()}
              {selectedTab === TABS.PROVENANCE && this.renderProvenanceTab()}
            </div>
          </div>
          {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
          <div className="controlbar">
            {!editBtnHide && selectedTab !== TABS.EDGES && (
              <button
                id="editbtn"
                onClick={this.uiRequestEditNode}
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
    const { selectedTab, backgroundColor, matchingNodeLabels, label } = this.state;
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
            <div className="nodelabel">{this.renderLabelInput('label', label)}</div>
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
              {this.renderTabSelectors()}
              <div className="tabview">
                {selectedTab === TABS.ATTRIBUTES && this.renderAttributesTabEdit()}
                {selectedTab === TABS.EDGES && this.renderEdgesTab()}
                {selectedTab === TABS.PROVENANCE && this.renderProvenanceTab()}
              </div>
            </div>
            {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
            <div className="controlbar">
              <button className="cancelbtn" onClick={this.uiCancelEditMode}>
                Cancel
              </button>
              <button onClick={this.saveNode}>Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER HELPERS
  renderTabSelectors() {
    const { selectedTab, viewMode } = this.state;
    return (
      <div className="tabselectors">
        {Object.keys(TABS).map(k => {
          return (
            <button
              id={k}
              key={k}
              type="button"
              className={selectedTab === TABS[k] ? 'selected' : ''}
              onClick={this.uiSelectTab}
              value={TABS[k]}
              disabled={viewMode === VIEWMODE.EDIT}
            >
              {TABS[k]}
            </button>
          );
        })}
      </div>
    );
  }
  renderAttributesTabView() {
    const { id, attributes } = this.state;
    const NODEDEFS = UDATA.AppState('TEMPLATE').nodeDefs;
    const items = [];
    Object.keys(attributes).forEach(k => {
      items.push(this.renderLabel(k, NODEDEFS[k].displayLabel));
      items.push(this.renderStringValue(k, attributes[k]));
    });
    return <div className="formview">{items}</div>;
  }
  renderAttributesTabEdit() {
    const { id, attributes } = this.state;
    const NODEDEFS = UDATA.AppState('TEMPLATE').nodeDefs;
    const items = [];
    Object.keys(attributes).forEach(k => {
      items.push(this.renderLabel(k, NODEDEFS[k].displayLabel));
      const type = NODEDEFS[k].type;
      const value = attributes[k] || ''; // catch `undefined` or React will complain about changing from uncontrolled to controlled
      switch (type) {
        case 'string':
          items.push(this.renderStringInput(k, value));
          break;
        case 'number':
          items.push(this.renderNumberInput(k, value));
          break;
        case 'select':
          items.push(this.renderOptionsInput(k, value));
          break;
        default:
          items.push(this.renderStringValue(k, value)); // display unsupported type
      }
    });
    return <div className="formview">{items}</div>;
  }
  renderEdgesTab() {
    const { selectedEdgeId, id, label, edges } = this.state;
    const NCDATA = UDATA.AppState('NCDATA');
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    const me = (
      <span style={{ color: 'rgba(0,0,0,0.2)', fontStyle: 'italic' }}>this node</span>
    );
    return (
      <div className="edges">
        {edges.map(e => {
          const sourceNode = NCDATA.nodes.find(n => n.id === e.source);
          const targetNode = NCDATA.nodes.find(n => n.id === e.target);
          const color = EDGEMGR.LookupEdgeColor(e, TEMPLATE);
          const bgcolor = color + '33'; // opacity hack
          if (e.id === selectedEdgeId) {
            return <NCEdge key={e.id} edge={e} />;
          } else {
            return (
              <div key={e.id}>
                <button
                  size="sm"
                  className="edgebutton"
                  onClick={() => this.uiViewEdge(e.id)}
                  style={{ backgroundColor: bgcolor }}
                >
                  {id === e.source ? me : sourceNode.label}
                  &nbsp;<span title={e.type}>&#x2794;</span>&nbsp;
                  {id === e.target ? me : targetNode.label}
                </button>
              </div>
            );
          }
        })}
      </div>
    );
  }
  renderProvenanceTab() {
    const { provenance, degrees, created, updated, revision } = this.state;
    const NODEDEFS = UDATA.AppState('TEMPLATE').nodeDefs;
    return (
      <div className="provenance formview">
        {this.renderLabel('provenancelabel', NODEDEFS.provenance.displayLabel)}
        {this.renderStringValue('provenancelabel', provenance)}
        {this.renderLabel('createdlabel', NODEDEFS.created.displayLabel)}
        {this.renderStringValue('createdlabel', created)}
        {this.renderLabel('updatedlabel', NODEDEFS.updated.displayLabel)}
        {this.renderStringValue('updatedlabel', updated)}
        {this.renderLabel('revisionlabel', NODEDEFS.revision.displayLabel)}
        {this.renderStringValue('revisionlabel', revision)}
        {this.renderLabel('degreeslabel', NODEDEFS.degrees.displayLabel)}
        {this.renderStringValue('degreeslabel', degrees)}
      </div>
    );
  }
  renderLabel(nodeDefKey, label) {
    return (
      <label htmlFor={nodeDefKey} key={`${nodeDefKey}label`}>
        {label}
      </label>
    );
  }
  renderStringValue(nodeDefKey, value) {
    return (
      <div id={nodeDefKey} key={`${nodeDefKey}value`}>
        {value}
      </div>
    );
  }
  renderStringInput(nodeDefKey, value) {
    return (
      <input
        id={nodeDefKey}
        key={`${nodeDefKey}input`}
        value={value}
        type="string"
        onChange={this.uiStringInputUpdate}
      />
    );
  }
  // special handler for node label
  renderLabelInput(nodeDefKey, value) {
    return (
      <input
        id={nodeDefKey}
        key={`${nodeDefKey}input`}
        value={value}
        type="string"
        onChange={this.uiLabelInputUpdate}
      />
    );
  }
  renderNumberInput(nodeDefKey, value) {
    return (
      <input
        id={nodeDefKey}
        key={`${nodeDefKey}input`}
        value={value}
        type="number"
        onChange={this.uiNumberInputUpdate}
      />
    );
  }
  renderOptionsInput(nodeDefKey, value) {
    const NODEDEFS = UDATA.AppState('TEMPLATE').nodeDefs;
    const options = NODEDEFS[nodeDefKey].options;
    return (
      <select
        id={nodeDefKey}
        key={`${nodeDefKey}select`}
        value={value}
        onChange={this.uiSelectInputUpdate}
      >
        {options.map(o => (
          <option key={o.label} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// MAIN RENDER
  render() {
    const { id, viewMode } = this.state;
    if (!id) return ''; // nothing selected
    if (viewMode === VIEWMODE.VIEW) {
      return this.renderView();
    } else {
      return this.renderEdit();
    }
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCNode;
