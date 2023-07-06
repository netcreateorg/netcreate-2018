/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Prototype Simple NetCreate Node Editor

    Data is currently in a transitional state.
    Currently all properties are saved in a flat list.
    Eventually we might want to differentiate between
    built-in properties (e.g. id, created), and template-defined custom
    `attributes`.  There is an awkward translation between these two
    representations during data load, update, and save.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'NCNode';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UNISYS = require('unisys/client');
const EDGEMGR = require('../edge-mgr'); // handles edge synthesis

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

    this.state = {}; // initialized on componentDidMount and clearSelection

    this.clearSelection = this.clearSelection.bind(this);
    this.updateSelection = this.updateSelection.bind(this);

    this.loadNode = this.loadNode.bind(this);
    this.loadEdges = this.loadEdges.bind(this);
    this.loadAttributes = this.loadAttributes.bind(this);
    this.updateLockState = this.lockNode.bind(this);
    this.unlockNode = this.unlockNode.bind(this);
    this.saveNode = this.saveNode.bind(this);

    this.uiSelectTab = this.uiSelectTab.bind(this);
    this.uiRequestEditNode = this.uiRequestEditNode.bind(this);
    this.enableEditMode = this.enableEditMode.bind(this);
    this.uiDisableEditMode = this.uiDisableEditMode.bind(this);
    this.uiStringInputUpdate = this.uiStringInputUpdate.bind(this);
    this.uiNumberInputUpdate = this.uiNumberInputUpdate.bind(this);
    this.uiSelectInputUpdate = this.uiSelectInputUpdate.bind(this);

    this.renderView = this.renderView.bind(this);
    this.renderEdit = this.renderEdit.bind(this);
    this.renderTabSelectors = this.renderTabSelectors.bind(this);
    this.renderAttributesTabView = this.renderAttributesTabView.bind(this);
    this.renderAttributesTabEdit = this.renderAttributesTabEdit.bind(this);
    this.renderEdgesTab = this.renderEdgesTab.bind(this);
    this.renderProvenanceTab = this.renderProvenanceTab.bind(this);
    this.renderLabel = this.renderLabel.bind(this);
    this.renderStringValue = this.renderStringValue.bind(this);
    this.renderStringInput = this.renderStringInput.bind(this);
    this.renderNumberInput = this.renderNumberInput.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// REGISTER LISTENERS
    UDATA.OnAppStateChange('SELECTION', this.updateSelection);
  }

  componentDidMount() {
    this.clearSelection(); // Initialize State
  }
  componentWillUnmount() {
    UDATA.AppStateChangeOff('SELECTION', this.updateSelection);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// EVENT HANDLERS
  clearSelection() {
    this.setState({
      // UI State
      viewMode: VIEWMODE.VIEW,
      selectedTab: TABS.ATTRIBUTES,
      backgroundColor: 'transparent',
      dbIsLocked: false,
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
  updateSelection(data) {
    const node = data.nodes[0]; // select the first node
    this.loadNode(node);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA LOADING
  ///
  loadNode(node) {
    const { viewMode } = this.state;

    // If we're editing, ignore the select!
    if (viewMode === VIEWMODE.EDIT) return;

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
          this.setState({
            dbIsLocked: nodeIsLocked
          });
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
        console.log(`SERVER SAYS: unlock success! you have released Node ${data.nodeID}`);
        unlockSuccess = true;
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
        console.log(`SERVER SAYS: Node is locked! You cannot edit Node ${data.nodeID}`);
        nodeIsLocked = true;
      }
      if (typeof cb === 'function') cb(nodeIsLocked);
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA SAVING
  ///
  saveNode() {
    const { id, label, attributes, provenance, created, updated, revision } = this.state;

    const node = { id, label, provenance, created, updated, revision };
    Object.keys(attributes).forEach(k => (node[k] = attributes[k]));

    // write data to database
    // setting dbWrite to true will distinguish this update
    // from a remote one
    this.AppCall('DB_UPDATE', { node }).then(() => {
      this.unlockNode(() => {
        this.setState({
          viewMode: VIEWMODE.VIEW,
          dbIsLocked: false
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
    const type = attributes ? attributes.type : undefined;
    if (!type) return;
    const COLORMAP = UDATA.AppState('COLORMAP');
    this.setState({ backgroundColor: COLORMAP.nodeColorMap[type] });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS

  uiSelectTab(event) {
    this.setState({ selectedTab: event.target.value });
  }

  /**
   * If `lockNode` is not successful, then that means the node was
   * already locked, so we can't edit.
   */
  uiRequestEditNode() {
    this.lockNode(lockSuccess => {
      this.setState({ dbIsLocked: !lockSuccess }, () => {
        if (lockSuccess) this.enableEditMode();
      });
    });
  }

  enableEditMode() {
    this.setState({ viewMode: VIEWMODE.EDIT });
  }

  uiDisableEditMode() {
    this.unlockNode(() =>
      this.setState({
        viewMode: VIEWMODE.VIEW,
        dbIsLocked: false
      })
    );
  }

  uiStringInputUpdate(event) {
    const nodeDefKey = event.target.id;
    if (BUILTIN_FIELDS.includes(nodeDefKey)) {
      data[nodeDefKey] = event.target.value;
      const data = {};
      this.setState(data);
    } else {
      const { attributes } = this.state;
      attributes[nodeDefKey] = event.target.value;
      this.setState({ attributes });
    }
  }
  uiNumberInputUpdate(event) {
    const nodeDefKey = event.target.id;
    if (BUILTIN_FIELDS.includes(nodeDefKey)) {
      data[nodeDefKey] = Number(event.target.value);
      const data = {};
      this.setState(data);
    } else {
      const { attributes } = this.state;
      attributes[nodeDefKey] = Number(event.target.value);
      this.setState({ attributes });
    }
  }
  uiSelectInputUpdate(event) {
    const nodeDefKey = event.target.id;
    if (BUILTIN_FIELDS.includes(nodeDefKey)) {
      data[nodeDefKey] = event.target.value;
      const data = {};
      this.setState(data);
    } else {
      const { attributes } = this.state;
      attributes[nodeDefKey] = event.target.value;
      this.setState({ attributes });
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER METHODS
  renderView() {
    const { selectedTab, backgroundColor, dbIsLocked, label } = this.state;
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    const nodeIsLockedMessage = TEMPLATE.nodeIsLockedMessage;
    const bgcolor = backgroundColor + '44'; // hack opacity
    return (
      <div className="ncnode">
        <div
          className="view"
          style={{
            background: bgcolor
          }}
        >
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
            <button id="editbtn" onClick={this.uiRequestEditNode} disabled={dbIsLocked}>
              Edit Node
            </button>
          </div>
          {dbIsLocked && <div className="message warning">{nodeIsLockedMessage}</div>}
        </div>
      </div>
    );
  }

  renderEdit() {
    const { selectedTab, backgroundColor, id, label } = this.state;
    const bgcolor = backgroundColor + '66'; // hack opacity
    return (
      <div className="ncnode">
        <div
          className="edit"
          style={{
            background: bgcolor,
            borderColor: backgroundColor
          }}
        >
          {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
          <div className="nodelabel">{this.renderStringInput('label', label)}</div>
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
            <button className="cancelbtn" onClick={this.uiDisableEditMode}>
              Cancel
            </button>
            <button onClick={this.saveNode}>Save</button>
          </div>
        </div>
      </div>
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER HELPERS
  renderTabSelectors() {
    const { selectedTab } = this.state;
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
      switch (type) {
        case 'string':
          items.push(this.renderStringInput(k, attributes[k]));
          break;
        case 'number':
          items.push(this.renderNumberInput(k, attributes[k]));
          break;
        case 'select':
          items.push(this.renderOptionsInput(k, attributes[k]));
          break;
        default:
          items.push(this.renderStringValue(k, attributes[k])); // display unsupported type
      }
    });
    return <div className="formview">{items}</div>;
  }
  renderEdgesTab() {
    const { id, label, edges } = this.state;
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
          return (
            <div key={e.id}>
              <button
                size="sm"
                className="edgebutton"
                onClick={this.onEdgeClick}
                style={{ backgroundColor: bgcolor }}
              >
                {id === e.source ? me : sourceNode.label}
                &nbsp;<span title={e.type}>&#x2794;</span>&nbsp;
                {id === e.target ? me : targetNode.label}
              </button>
            </div>
          );
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
    }
    return this.renderEdit();
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCNode;
