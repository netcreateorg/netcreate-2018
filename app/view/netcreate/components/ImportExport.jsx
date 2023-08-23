/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  Provides tools to import and export node/edge data files.

  This also provides a "Force Unlock All" button that can be used by Admins
  to unlock all edit locks requested by node editors, edge editors, template
  editors, and importers on the network.

  This displays a subpanel on the "More..." tab.

  `importexport-mgr.js` (IMPORTEXPORT) handles all of the business logic for
  importing and exporting.  See that file for details.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'ImportExport';
var UDATA = null;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { Button, Table } = ReactStrap;
const SETTINGS = require('settings');
const NetMessage = require('unisys/common-netmessage-class');

const UNISYS = require('unisys/client');
const DATASTORE = require('system/datastore');
const { EDITORTYPE } = require('system/util/enum');

const IMPORTEXPORT = require('../importexport-mgr');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NODEFILESTATUS_DEFAULT = 'Select a node .csv file to import';
const EDGEFILESTATUS_DEFAULT = 'Select an edge .csv file to import';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class ImportExport extends UNISYS.Component {
  constructor(props) {
    super(props);
    const TEMPLATE = this.AppState('TEMPLATE');
    this.state = {
      isExpanded: true,
      preventImport: false, // an external source has disabled import for us
      importIsActive: false, // internal source: keeps track of whether THIS panel has valid import files selected
      nodefile: undefined,
      nodefileStatus: NODEFILESTATUS_DEFAULT,
      nodeValidationMsgs: undefined,
      nodeOkToImport: false,
      edgefile: undefined,
      edgefileStatus: EDGEFILESTATUS_DEFAULT,
      edgeValidationMsgs: undefined,
      edgeOkToImport: false,
      okToImport: false,
      importMsgs: undefined,
      allowLoggedInUserToImport: TEMPLATE.allowLoggedInUserToImport
    };
    this.checkUnload = this.checkUnload.bind(this);
    this.doUnload = this.doUnload.bind(this);
    this.handleEditStateUpdate = this.handleEditStateUpdate.bind(this);
    this.updateEditState = this.updateEditState.bind(this);
    this.onNodesExportSelect = this.onNodesExportSelect.bind(this);
    this.onEdgesExportSelect = this.onEdgesExportSelect.bind(this);
    this.onNodeImportFileSelect = this.onNodeImportFileSelect.bind(this);
    this.onEdgeImportFileSelect = this.onEdgeImportFileSelect.bind(this);
    this.clearNodefileSelect = this.clearNodefileSelect.bind(this);
    this.clearEdgefileSelect = this.clearEdgefileSelect.bind(this);
    this.clearFileSelect = this.clearFileSelect.bind(this);
    this.onDoImport = this.onDoImport.bind(this);
    this.unlockAll = this.unlockAll.bind(this);

    UDATA = UNISYS.NewDataLink(this);
    UDATA.HandleMessage('EDIT_PERMISSIONS_UPDATE', this.handleEditStateUpdate);
  } // constructor

  componentDidMount() {
    this.updateEditState();
    window.addEventListener('beforeunload', this.checkUnload);
    window.addEventListener('unload', this.doUnload);
  }

  componentWillUnmount() {
    UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    UDATA.UnhandleMessage('EDIT_PERMISSIONS_UPDATE', this.handleEditStateUpdate);
    window.removeEventListener('beforeunload', this.checkUnload);
    window.removeEventListener('unload', this.doUnload);
  }

  checkUnload(e) {
    e.preventDefault();
    if (this.state.importIsActive) {
      (e || window.event).returnValue = null;
    } else {
      Reflect.deleteProperty(e, 'returnValue');
    }
    return e;
  }

  doUnload(e) {
    if (this.state.importIsActive) {
      this.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    }
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  handleEditStateUpdate(data) {
    const { importIsActive } = this.state;
    if (!importIsActive) {
      const preventImport =
        data.templateBeingEdited ||
        data.importActive ||
        data.nodeOrEdgeBeingEdited ||
        UNISYS.IsStandaloneMode();
      this.setState({ preventImport });
    }
  }
  updateEditState() {
    // disable edit if someone else is editing a template, node, or edge
    UDATA.NetCall('SRV_GET_EDIT_STATUS').then(this.handleEditStateUpdate);
    DATASTORE.PromiseCalculateMaxNodeId().then(data => {
      this.setState({ nextNodeId: data + 1 });
    });
    DATASTORE.PromiseCalculateMaxEdgeId().then(data => {
      this.setState({ nextEdgeId: data + 1 });
    });
  }

  onNodesExportSelect() {
    IMPORTEXPORT.ExportNodes();
  }
  onEdgesExportSelect() {
    IMPORTEXPORT.ExportEdges();
  }

  onNodeImportFileSelect(e) {
    const nodefile = e.target.files[0];
    IMPORTEXPORT.NodefileValidate({ nodefile }).then(result => {
      const msg = (
        <div>
          <div>{result.messageTitle}</div>
          {result.messageJsx}
        </div>
      );
      // if edge file was already okToImport, then this remains OK.
      const okToImport = this.state.edgeOkToImport || result.isValid;
      this.setState({
        nodeOkToImport: result.isValid,
        okToImport,
        nodefileStatus: result.isValid ? 'Ready to Import' : NODEFILESTATUS_DEFAULT,
        nodeValidationMsgs: msg,
        importMsgs: undefined
      });
      // Clear "Choose File"
      if (!result.isValid) document.getElementById('nodefileInput').value = '';
    });
  }
  onEdgeImportFileSelect(e) {
    const edgefile = e.target.files[0];
    IMPORTEXPORT.EdgefileValidate({ edgefile }).then(result => {
      const msg = (
        <div>
          <div>{result.messageTitle}</div>
          {result.messageJsx}
        </div>
      );
      // if edge file was already okToImport, then this remains OK.
      const okToImport = this.state.nodeOkToImport || result.isValid;
      this.setState({
        edgeOkToImport: result.isValid,
        okToImport,
        edgefileStatus: result.isValid ? 'Ready to Import' : EDGEFILESTATUS_DEFAULT,
        edgeValidationMsgs: msg,
        importMsgs: undefined
      });
      // Clear "Choose File"
      if (!result.isValid) document.getElementById('edgefileInput').value = '';
    });
  }

  clearNodefileSelect() {
    // User Cancelled, reset to default
    // If edge import is active, then import remains active
    const importIsActive = this.state.importIsActive || false;
    this.setState({
      importIsActive,
      nodefile: undefined,
      nodefileStatus: NODEFILESTATUS_DEFAULT,
      nodeValidationMsgs: undefined
    });
    // Clear validated data so it doesn't get imported
    if (!importIsActive)
      UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    IMPORTEXPORT.ResetNodeImportData();
  }

  clearEdgefileSelect() {
    // User Cancelled, reset to default
    // If node import is active, then import remains active
    const importIsActive = this.state.importIsActive || false;
    this.setState({
      importIsActive,
      edgefile: undefined,
      edgefileStatus: EDGEFILESTATUS_DEFAULT,
      edgeValidationMsgs: undefined
    });
    // Clear validated data so it doesn't get imported
    if (!importIsActive)
      UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    IMPORTEXPORT.ResetEdgeImportData();
  }

  clearFileSelect() {
    // User Cancelled, reset to default
    UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    document.getElementById('nodefileInput').value = '';
    document.getElementById('edgefileInput').value = '';
    this.clearNodefileSelect();
    this.clearEdgefileSelect();

    IMPORTEXPORT.ResetImportData();
    this.setState({
      nodeValidationMsgs: undefined,
      edgeValidationMsgs: undefined,
      importMsgs: undefined
    });
  }

  onDoImport() {
    if (DBG) console.log(PR, 'onDoImport');
    IMPORTEXPORT.Import().then(result => {
      this.setState({
        okToImport: false, // imported, so hide "Import" button
        nodeOkToImport: false,
        edgeOkToImport: false,
        importMsgs: result.messageJsx
      });
      document.getElementById('nodefileInput').value = '';
      document.getElementById('edgefileInput').value = '';
    });
  }

  unlockAll() {
    UDATA.NetCall('SRV_DBUNLOCKALL');
  }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const {
      preventImport,
      importIsActive,
      nodefile,
      nodefileStatus,
      edgefile,
      edgefileStatus,
      importMsgs,
      allowLoggedInUserToImport,
      nextNodeId,
      nextEdgeId,
      nodeValidationMsgs,
      edgeValidationMsgs,
      okToImport
    } = this.state;

    // Set Import Permissions
    // -- Admins can always import
    // -- If allowLoggedInUserToImport, logged in users can also import
    const ISADMIN = SETTINGS.IsAdmin();
    const isLoggedIn = NetMessage.GlobalGroupID();
    const importDisabled = !(ISADMIN || (allowLoggedInUserToImport && isLoggedIn));

    const importBtnDisabled = !okToImport;

    let importjsx;
    if (preventImport && !importIsActive) {
      importjsx = (
        <div
          style={{
            backgroundColor: 'rgba(240,240,240,0.95)',
            marginTop: '10px',
            padding: '10px 20px'
          }}
        >
          <p>
            <i>
              You cannot import data while someone is editing a node, edge, or
              template, or in standalone view.
            </i>
          </p>
          <p>
            <i>Please finish editing and try again.</i>
          </p>
        </div>
      );
    } else {
      importjsx = (
        <div
          hidden={importDisabled}
          style={{
            backgroundColor: 'rgba(240,240,240,0.95)',
            marginTop: '10px',
            padding: '10px 20px'
          }}
        >
          <h1>Import Data</h1>
          <div className="small text-muted">
            <i>Import .csv data</i>
          </div>
          <div className="small text-muted">
            To specify node and edge IDs in your import file, use the next unused ID:
            <ul>
              <li>Next unused NODE ID: {nextNodeId}</li>
              <li>Next unused EDGE ID: {nextEdgeId}</li>
            </ul>
          </div>
          <label className="small text-muted">
            Nodes:&nbsp;
            <input
              type="file"
              accept="text/csv"
              id="nodefileInput"
              onInput={this.onNodeImportFileSelect}
              onClick={e => {
                // Clear the selected node file whenever "Choose File" is clicked so that if the user
                // cancels, the form is reset to a blank state.  This is necessary to clear out
                // validation errors after selecting a bad node file.
                this.clearNodefileSelect();
              }}
            />
            &nbsp;<i className="small">{nodefileStatus}</i>
            <br />
          </label>
          <br />
          <label className="small text-muted">
            Edges:&nbsp;
            <input
              type="file"
              accept="text/csv"
              id="edgefileInput"
              onInput={this.onEdgeImportFileSelect}
              onClick={e => {
                // Clear the selected edge file whenever "Choose File" is clicked so that if the user
                // cancels, the form is reset to a blank state.  This is necessary to clear out
                // validation errors after selecting a bad edge file.
                this.clearEdgefileSelect();
              }}
            />
            &nbsp;<i className="small">{edgefileStatus}</i>
            <br />
          </label>
          <br />
          <label>
            <Button
              style={{ fontSize: '0.8em', padding: '0px 2px' }}
              outline
              onClick={this.clearFileSelect}
            >
              Clear File Selections
            </Button>
          </label>
          <br />
          {nodeValidationMsgs && <div className="small">{nodeValidationMsgs}</div>}
          {edgeValidationMsgs && <div className="small">{edgeValidationMsgs}</div>}
          {importMsgs && <div className="small">{importMsgs}</div>}
          <Button
            size="sm"
            outline
            color={importBtnDisabled ? 'light' : 'primary'}
            disabled={importBtnDisabled}
            onClick={this.onDoImport}
          >
            Import
          </Button>
          &nbsp;
        </div>
      );
    }

    let unlockAlljsx;
    if (ISADMIN) {
      unlockAlljsx = (
        <div>
          <hr />
          <h1>Admin Tools</h1>
          <Button size="sm" outline color={'warning'} onClick={this.unlockAll}>
            Force Unlock All
          </Button>
          <label className="small text-muted">
            Unlock ALL Template, Import, Node, and Edge Editing.
            <br />
            When someone on the network is editing a template, importing data, or
            editing a node or edge, everyone else on the network is prevented from
            editing a template or importing data and editing nodes and edges.
            <br />
            ADMINS: Use this force the server to release the lock on editing if you
            know the lock was left on in error, e.g. you know that there is no one on
            the network actively editing a template, importing, editing a node or an
            edge.
            <p>
              <b>WARNING</b>: Use this with utmost caution! If someone is actively
              editing or importing, you can delete their work, or even worse,{' '}
              <b>corrupt the database!</b>
            </p>
          </label>
        </div>
      );
    }

    return (
      <div>
        <div
          style={{
            backgroundColor: 'rgba(240,240,240,0.95)',
            padding: '10px 20px'
          }}
        >
          <h1>Export Data</h1>
          <i className="small text-muted">Export data in .csv format.</i>
          <br />
          <Button size="sm" outline onClick={this.onNodesExportSelect}>
            Export Nodes
          </Button>
          &nbsp;
          <Button size="sm" outline onClick={this.onEdgesExportSelect}>
            Export Edges
          </Button>
          &nbsp;
        </div>

        {importjsx}
        {unlockAlljsx}
      </div>
    );
  }
} // class Help

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ImportExport;
