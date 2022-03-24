/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    Help displays a hideable generic help screen.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;
var UDATA = null;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Table }    = ReactStrap;
const SETTINGS = require("settings");
const NetMessage = require("unisys/common-netmessage-class");

const UNISYS   = require('unisys/client');
const DATASTORE = require("system/datastore");
const { EDITORTYPE } = require("system/util/enum");

const IELOGIC = require("../importexport-logic");

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NODEFILESTATUS_DEFAULT = 'Select a node .csv file to import';
const EDGEFILESTATUS_DEFAULT = 'Select an edge .csv file to import';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class ImportExport extends UNISYS.Component {
  constructor (props) {
    super(props);
    const TEMPLATE = this.AppState('TEMPLATE');
    this.state = {
      isExpanded: true,
      preventImport: false, // an external source has disabled import for us
      importIsActive: false, // internal source: keeps track of whether THIS panel has valid import files selected
      nodefile: undefined,
      nodefileStatus: NODEFILESTATUS_DEFAULT,
      nodefileErrors: undefined,
      nodeImportErrors: undefined,
      edgefile: undefined,
      edgefileStatus: EDGEFILESTATUS_DEFAULT,
      edgefileErrors: undefined,
      edgeImportErrors: undefined,
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
    UDATA.HandleMessage("EDIT_PERMISSIONS_UPDATE", this.handleEditStateUpdate);
  } // constructor

  componentDidMount() {
    this.updateEditState();
    window.addEventListener("beforeunload", this.checkUnload);
    window.addEventListener("unload", this.doUnload);
  }

  componentWillUnmount() {
    UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.IMPORTER});
    UDATA.UnhandleMessage("EDIT_PERMISSIONS_UPDATE", this.handleEditStateUpdate);
    window.removeEventListener("beforeunload", this.checkUnload);
    window.removeEventListener("unload", this.doUnload);
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
      this.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.IMPORTER });
    }
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  handleEditStateUpdate(data) {
    const { importIsActive } = this.state;
    if (!importIsActive) {
      const preventImport = data.templateBeingEdited || data.importActive || data.nodeOrEdgeBeingEdited || UNISYS.IsStandaloneMode();
      this.setState({ preventImport });
    }
  }
  updateEditState() {
    // disable edit if someone else is editing a template, node, or edge
    UDATA.NetCall("SRV_GET_EDIT_STATUS")
      .then(this.handleEditStateUpdate);
    DATASTORE.PromiseCalculateMaxNodeId().then(data => {
      this.setState({ nextNodeId: data + 1 })
    })
    DATASTORE.PromiseCalculateMaxEdgeId().then(data => {
      this.setState({ nextEdgeId: data + 1 })
    })
  }

  onNodesExportSelect() { IELOGIC.ExportNodes(); }
  onEdgesExportSelect() { IELOGIC.ExportEdges(); }

  onNodeImportFileSelect(e) {
    const nodefile = e.target.files[0];
    IELOGIC.ValidateNodeFile({ nodefile })
      .then(result => {
        if (result.isValid) {
          // First set importIsActive, and then request lock
          // so that after lock is received, handleEditStateUpdate will not undo importIsActive
          this.setState({ importIsActive: true }, () => {
            UDATA.NetCall("SRV_REQ_EDIT_LOCK", { editor: EDITORTYPE.IMPORTER }).then(data => {
              this.setState({
                nodefile,
                nodefileStatus: "Ready for import",
                nodefileErrors: undefined,
                nodeImportErrors: undefined,
                importMsgs: undefined
              });
            });
          });
        } else {
          // Force Clear so that if the user fixes the file and reselects it
          // 'onChange' will trigger and the file will be processed.
          // Otherwise, reselecting the file will not trigger 'onChange'
          document.getElementById('nodefileInput').value = "";
          if (result.missingKeys.length > 0) {
            // user selected file with missing keys
            this.setState({
              importIsActive: false,
              nodefile: undefined,
              nodefileStatus: `"${nodefile.name}" is not a valid nodes csv file!!!`,
              nodefileErrors: (
                <div>
                  <div>Missing keys: {result.missingKeys.join(', ')}</div>
                  <div>Keys found in file: {result.fileKeys.join(', ')}</div>
                </div>
              ),
              nodeImportErrors: undefined,
              importMsgs: undefined
            });
          } else {
            // User Cancelled, reset to default
            this.clearNodefileSelect();
          }
        }
      });
  }

  onEdgeImportFileSelect(e) {
    const edgefile = e.target.files[0];
    IELOGIC.ValidateEdgeFile({ edgefile })
      .then(result => {
        if (result.isValid) {
          // A. Valid edge file, ready for import
          // First set importIsActive, and then request lock
          // so that after lock is received, handleEditStateUpdate will not undo importIsActive
          this.setState({ importIsActive: true }, () => {
            UDATA.NetCall("SRV_REQ_EDIT_LOCK", { editor: EDITORTYPE.IMPORTER }).then(data => {
              this.setState({
                edgefile,
                edgefileStatus: "Ready for import",
                edgefileErrors: undefined,
                edgeImportErrors: undefined,
                importMsgs: undefined
              });
            });
          });
        } else {
          // Force Clear so that if the user fixes the file and reselects it
          // 'onChange' will trigger and the file will be processed.
          // Otherwise, reselecting the file will not trigger 'onChange'
          document.getElementById('edgefileInput').value = "";
          if (result.missingKeys.length > 0) {
            // B. Error user selected file with missing keys
            this.setState({
              importIsActive: false,
              edgefile: undefined,
              edgefileStatus: `"${edgefile.name}" is not a valid edges csv file!!!`,
              edgefileErrors: (
                <div>
                  <div>Missing keys: {result.missingKeys.join(', ')}</div>
                  <div>Keys found in file: {result.fileKeys.join(', ')}</div>
                </div>
              ),
              edgeImportErrors: undefined,
              importMsgs: undefined
            });
          } else {
            // C. User Cancelled, reset to default
            if (this.state.importIsActive) {
              console.error('releasing lock -- probably had a previously valid edge file');
              UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.IMPORTER });
            }
            this.clearEdgefileSelect();
          }
        }
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
      nodefileErrors: undefined,
      nodeImportErrors: undefined
    });
    if (!importIsActive) UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.IMPORTER });
  }

  clearEdgefileSelect() {
    // User Cancelled, reset to default
    // If node import is active, then import remains active
    const importIsActive = this.state.importIsActive || false;
    this.setState({
      importIsActive,
      edgefile: undefined,
      edgefileStatus: EDGEFILESTATUS_DEFAULT,
      edgefileErrors: undefined,
      edgeImportErrors: undefined
    });
    if (!importIsActive) UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.IMPORTER });
  }

  clearFileSelect() {
    // User Cancelled, reset to default
    UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.IMPORTER });
    document.getElementById('nodefileInput').value = "";
    document.getElementById('edgefileInput').value = "";
    this.clearNodefileSelect();
    this.clearEdgefileSelect();
  }

  onDoImport() {
    const nodeFilename = this.state.nodefile && this.state.nodefile.name; // save off for error messages
    const edgeFilename = this.state.edgefile && this.state.edgefile.name; // save off for error messages
    IELOGIC.Import().then(result => {
      if (result.nodeImportErrors || result.edgeImportErrors) {
        this.setState({
          importIsActive: false,
          nodefileStatus: NODEFILESTATUS_DEFAULT,
          nodeImportErrors: result.nodeImportErrors && result.nodeImportErrors.length>0 &&(
            <div>IMPORT NODES ERROR: "{nodeFilename}" not imported.<br />
              <ul>{result.nodeImportErrors.map((e, i) => (<li key={i}>{e}</li>))}</ul>
            </div>),
          edgefileStatus: EDGEFILESTATUS_DEFAULT,
          edgeImportErrors: result.edgeImportErrors && result.edgeImportErrors.length>0 && (
            <div>IMPORT EDGES ERROR: "{edgeFilename}" not imported.<br />
              <ul>{result.edgeImportErrors.map((e, i) => (<li key={i}>{e}</li>))}</ul>
            </div>)
        });
      } else {
        // Don't close the "More" tab so we can display results
        // UDATA.LocalCall('UI_CLOSE_MORE'); // InfoPanel.jsx

        // clear files for next import
        this.setState({
          importIsActive: false,
          nodefile: undefined,
          nodefileStatus: NODEFILESTATUS_DEFAULT,
          nodefileErrors: undefined,
          nodeImportErrors: undefined,
          edgefile: undefined,
          edgefileStatus: EDGEFILESTATUS_DEFAULT,
          edgefileErrors: undefined,
          edgeImportErrors: undefined,
          importMsgs: result.messages && (
            <div>IMPORTED: {nodeFilename ? `"${nodeFilename}"` : ''} {edgeFilename ? `"${edgeFilename}"` : ''}:<br />
              <ul>{result.messages.map((e, i) => (<li key={i}>{e}</li>))}</ul>
            </div>)
        });
      }
      this.clearFileSelect();
    }); // nc-logic -> export-logic
  }

  unlockAll() {
    UDATA.NetCall("SRV_DBUNLOCKALL");
  }

/// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const {
      preventImport,
      importIsActive,
      nodefile,
      nodefileStatus,
      nodefileErrors,
      nodeImportErrors,
      edgefile,
      edgefileStatus,
      edgefileErrors,
      edgeImportErrors,
      importMsgs,
      allowLoggedInUserToImport,
      nextNodeId,
      nextEdgeId
    } = this.state;

    // Set Import Permissions
    // -- Admins can always import
    // -- If allowLoggedInUserToImport, logged in users can also import
    const ISADMIN = SETTINGS.IsAdmin();
    const isLoggedIn = NetMessage.GlobalGroupID();
    const importDisabled = !(ISADMIN || (allowLoggedInUserToImport && isLoggedIn));

    const importBtnDisabled = (!nodefile && !edgefile) ||
      nodefileErrors !== undefined || nodeImportErrors !== undefined ||
      edgefileErrors !== undefined || edgeImportErrors !== undefined;

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
          <p><i>You cannot import data while someone is editing a node, edge,
            or template, or in standalone view.</i></p>
          <p><i>Please finish editing and try again.</i></p>
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
            To specify node and edge IDs in your import file, use the next unused ID:
            <ul>
              <li>Next unused NODE ID: {nextNodeId}</li>
              <li>Next unused EDGE ID: {nextEdgeId}</li>
            </ul>
          </div>
          <i className="small text-muted">Import .csv data</i><br />
          <label>
            <input type="file" accept="text/csv" id="nodefileInput" onInput={this.onNodeImportFileSelect}
              onClick={e => {
                // Clear the selected node file whenever "Choose File" is clicked so that if the user
                // cancels, the form is reset to a blank state.  This is necessary to clear out
                // validation errors after selecting a bad node file.
                this.clearNodefileSelect();
              }}
            />
            &nbsp;<i>{nodefileStatus}</i><br />
            {nodefileErrors && <span style={{ color: "red" }}>{nodefileErrors}</span>}
          </label><br />
          <label>
            <input type="file" accept="text/csv" id="edgefileInput" onInput={this.onEdgeImportFileSelect}
              onClick={e => {
                // Clear the selected edge file whenever "Choose File" is clicked so that if the user
                // cancels, the form is reset to a blank state.  This is necessary to clear out
                // validation errors after selecting a bad edge file.
                this.clearEdgefileSelect();
              }}
            />
            &nbsp;<i>{edgefileStatus}</i><br />
            {edgefileErrors && <span style={{ color: "red" }}>{edgefileErrors}</span>}
          </label><br />
          <label>
            <Button style={{ fontSize: '0.8em', padding: '0px 2px' }} outline onClick={this.clearFileSelect}>
              Clear File Selections
            </Button>
          </label><br />
          {nodeImportErrors && <div style={{ color: "red" }}>{nodeImportErrors}</div>}
          {edgeImportErrors && <div style={{ color: "red" }}>{edgeImportErrors}</div>}
          {importMsgs && <div>{importMsgs}</div>}
          <Button size="sm" outline color={importBtnDisabled ? "light" : "primary"} disabled={importBtnDisabled} onClick={this.onDoImport}>
            Import
          </Button>&nbsp;
        </div>
      )
    }

    let unlockAlljsx;
    if (ISADMIN) {
      unlockAlljsx = (
        <div>
          <hr />
          <h1>Admin Tools</h1>
          <Button size="sm" outline color={"warning"} onClick={this.unlockAll}>
            Force Unlock All
          </Button>
          <label className="small text-muted">
            Unlock ALL Template, Import, Node, and Edge Editing.<br />
            When someone on the network is editing a template, importing data, or editing a node or edge, everyone
            else on the network is prevented from editing a template or importing data and editing nodes and edges.<br />
            ADMINS: Use this force the server to release the lock on editing if you know the lock was left on in error,
            e.g. you know that there is no one on the network actively editing a template, importing, editing a node or an edge.
            <p><b>WARNING</b>: Use this with utmost caution!  If someone is actively editing or importing, you can delete their work, or even worse, <b>corrupt the database!</b></p>
          </label>
        </div>
      )
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

          <i className="small text-muted">Export data in .csv format.</i><br/>
          <Button size="sm" outline onClick={this.onNodesExportSelect}>
            Export Nodes
          </Button>&nbsp;
          <Button size="sm" outline onClick={this.onEdgesExportSelect}>
            Export Edges
          </Button>&nbsp;
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
