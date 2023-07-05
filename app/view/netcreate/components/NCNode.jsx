/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Prototype Simple NetCreate Node Editor

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'NCNode';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UNISYS = require('unisys/client');
const EDGEMGR = require('../edge-mgr'); // handles edge synthesis

let UDATA;

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

    this.clearSelection = this.clearSelection.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.loadNode = this.loadNode.bind(this);
    this.loadEdges = this.loadEdges.bind(this);
    this.uiSelectTab = this.uiSelectTab.bind(this);
    this.renderView = this.renderView.bind(this);
    this.renderEdit = this.renderEdit.bind(this);
    this.renderTabSelectors = this.renderTabSelectors.bind(this);
    this.renderAttributesTab = this.renderAttributesTab.bind(this);
    this.renderEdgesTab = this.renderEdgesTab.bind(this);
    this.renderProvenanceTab = this.renderProvenanceTab.bind(this);
    this.renderLabel = this.renderLabel.bind(this);
    this.renderStringValue = this.renderStringValue.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// REGISTER LISTENERS
    UDATA.OnAppStateChange('SELECTION', this.updateSelection);
  }

  componentWillMount() {
    this.clearSelection(); // Initialize State
  }
  componentWillUnmount() {
    UDATA.AppStateChangeOff('SELECTION', this.updateSelection);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// EVENT HANDLERS
  clearSelection() {
    this.setState({
      viewMode: VIEWMODE.VIEW,
      selectedTab: TABS.ATTRIBUTES,
      backgroundColor: 'transparent',
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
  loadNode(node) {
    if (!node) {
      this.clearSelection();
      return;
    }
    // REVIEW: Does ui-mgr define this mapping?  Or do we read it from the template?
    const attributes = {
      type: node.type,
      notes: node.notes,
      info: node.info
    };
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// HELPER METHODS
  setBackgroundColor() {
    // This will eventually be replaced with a proper color manager
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER METHODS
  renderView() {
    const { selectedTab, backgroundColor, id, label } = this.state;
    const bgcolor = backgroundColor + '33'; // hack opacity
    return (
      <div
        className="ncnode view"
        style={{
          background: bgcolor
        }}
      >
        {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
        <div className="nodelabel">{this.renderStringValue(id, 'LABEL', label)}</div>
        {/* TABS - - - - - - - - - - - - - - - - - - - */}
        <div className="tabcontainer">
          {this.renderTabSelectors()}
          <div className="tabview">
            {selectedTab === TABS.ATTRIBUTES && this.renderAttributesTab()}
            {selectedTab === TABS.EDGES && this.renderEdgesTab()}
            {selectedTab === TABS.PROVENANCE && this.renderProvenanceTab()}
          </div>
        </div>
      </div>
    );
  }

  renderEdit() {}

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
  renderAttributesTab() {
    const { id, attributes } = this.state;
    const items = [];
    Object.keys(attributes).forEach(k => {
      items.push(this.renderLabel(id, k));
      items.push(this.renderStringValue(id, k, attributes[k]));
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
    const { id, provenance, created, updated, revision } = this.state;
    return (
      <div className="provenance formview">
        {this.renderLabel(id, 'PROVENANCE')}
        {this.renderStringValue(id, 'PROVENANCE', provenance)}
        {this.renderLabel(id, 'CREATED')}
        {this.renderStringValue(id, 'CREATED', created)}
        {this.renderLabel(id, 'UPDATED')}
        {this.renderStringValue(id, 'UPDATED', updated)}
        {this.renderLabel(id, 'REVISION')}
        {this.renderStringValue(id, 'REVISION', revision)}
      </div>
    );
  }
  renderLabel(id, label) {
    return (
      <label htmlFor={`${id}.${label}`} key={`${id}.${label}label`}>
        {label}
      </label>
    );
  }
  renderStringValue(id, label, value) {
    return (
      <div id={`${id}.${label}`} key={`${id}.${label}value`}>
        {value}
      </div>
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
