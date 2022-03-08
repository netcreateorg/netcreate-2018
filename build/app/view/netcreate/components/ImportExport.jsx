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
    this.onNodesExportSelect = this.onNodesExportSelect.bind(this);
    this.onEdgesExportSelect = this.onEdgesExportSelect.bind(this);
    this.onNodeImportFileSelect = this.onNodeImportFileSelect.bind(this);
    this.onEdgeImportFileSelect = this.onEdgeImportFileSelect.bind(this);
    this.onDoImport = this.onDoImport.bind(this);

    UDATA = UNISYS.NewDataLink(this);
  } // constructor

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  onNodesExportSelect() { UDATA.LocalCall('EXPORT_NODES'); }
  onEdgesExportSelect() { UDATA.LocalCall('EXPORT_EDGES'); }

  onNodeImportFileSelect(e) {
    const nodefile = e.target.files[0];
    UDATA.LocalCall('VALIDATE_NODEFILE', { nodefile })
      .then(result => {
        if (result.isValid) {
          this.setState({
            nodefile,
            nodefileStatus: "Ready for import",
            nodefileErrors: undefined,
            nodeImportErrors: undefined
          });
        } else {
          if (result.missingKeys.length > 0) {
            // user selected file with missing keys
            this.setState({
              nodefile: undefined,
              nodefileStatus: `"${nodefile.name}" is not a valid nodes csv file!!!`,
              nodefileErrors: (
                <div>
                  <div>Missing keys: {result.missingKeys.join(', ')}</div>
                  <div>Keys found in file: {result.fileKeys.join(', ')}</div>
                </div>
              ),
              nodeImportErrors: undefined
            });
          } else {
            // User Cancelled, reset to default
            this.setState({
              nodefile: undefined,
              nodefileStatus: NODEFILESTATUS_DEFAULT,
              nodefileErrors: undefined,
              nodeImportErrors: undefined
            });
          }
          // Force Clear so that if the user fixes the file and reselects it
          // 'onChange' will trigger and the file will be processed.
          // Otherwise, reselecting the file will not trigger 'onChange'
          document.getElementById('nodefileInput').value = "";
        }
      });
  }

  onEdgeImportFileSelect(e) {
    const edgefile = e.target.files[0];
    UDATA.LocalCall('VALIDATE_EDGEFILE', { edgefile })
      .then(result => {
        if (result.isValid) {
          this.setState({
            edgefile,
            edgefileStatus: "Ready for import",
            edgefileErrors: undefined,
            edgeImportErrors: undefined,
            importMsgs: undefined
          });
        } else {
          if (result.missingKeys.length > 0) {
            // user selected file with missing keys
            this.setState({
              edgefile: undefined,
              edgefileStatus: `"${edgefile.name}" is not a valid edges csv file!!!`,
              edgefileErrors: (
                <div>
                  <div>Missing keys: {result.missingKeys.join(', ')}</div>
                  <div>Keys found in file: {result.fileKeys.join(', ')}</div>
                </div>
              ),
              edgeImportErrors: undefined
            });
          } else {
            // User Cancelled, reset to default
            this.setState({
              edgefile: undefined,
              edgefileStatus: EDGEFILESTATUS_DEFAULT,
              edgefileErrors: undefined,
              edgeImportErrors: undefined,
              importMsgs: undefined
            });
          }
          // Force Clear so that if the user fixes the file and reselects it
          // 'onChange' will trigger and the file will be processed.
          // Otherwise, reselecting the file will not trigger 'onChange'
          document.getElementById('edgefileInput').value = "";
        }
      });
  }

  onDoImport() {
    const nodeFilename = this.state.nodefile && this.state.nodefile.name; // save off for error messages
    const edgeFilename = this.state.edgefile && this.state.edgefile.name; // save off for error messages
    UDATA.LocalCall('IMPORT').then(result => {
      if (result.nodeImportErrors || result.edgeImportErrors) {
        this.setState({
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
          nodefile: undefined,
          nodefileStatus: NODEFILESTATUS_DEFAULT,
          nodefileErrors: undefined,
          nodeImportErrors: undefined,
          edgefile: undefined,
          edgefileStatus: EDGEFILESTATUS_DEFAULT,
          edgefileErrors: undefined,
          edgeImportErrors: undefined,
          importMsgs: result.messages && (
            <div>IMPORT NOTES:<br />
              <ul>{result.messages.map((e, i) => (<li key={i}>{e}</li>))}</ul>
            </div>)
        });
      }
      // Always clear inputs so user can reselect
      document.getElementById('nodefileInput').value = "";
      document.getElementById('edgefileInput').value = "";
    }); // nc-logic -> export-logic
  }


/// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const {
      nodefile,
      nodefileStatus,
      nodefileErrors,
      nodeImportErrors,
      edgefile,
      edgefileStatus,
      edgefileErrors,
      edgeImportErrors,
      importMsgs,
      allowLoggedInUserToImport
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

        <div
          hidden={importDisabled}
          style={{
            backgroundColor: 'rgba(240,240,240,0.95)',
            marginTop: '10px',
            padding: '10px 20px'
          }}
        >
          <h1>Import Data</h1>

          <i className="small text-muted">Import .csv data</i><br/>
          <label>
            <input type="file" accept="text/csv" id="nodefileInput" onChange={this.onNodeImportFileSelect}/>
            &nbsp;<i>{nodefileStatus}</i><br />
            {nodefileErrors && <span style={{ color: "red" }}>{nodefileErrors}</span>}
          </label><br />
          <label>
            <input type="file" accept="text/csv" id="edgefileInput" onInput={this.onEdgeImportFileSelect}/>
            &nbsp;<i>{edgefileStatus}</i><br />
            {edgefileErrors && <span style={{ color: "red" }}>{edgefileErrors}</span>}
          </label><br />
          {nodeImportErrors && <div style={{ color: "red" }}>{nodeImportErrors}</div>}
          {edgeImportErrors && <div style={{ color: "red" }}>{edgeImportErrors}</div>}
          {importMsgs && <div>{importMsgs}</div>}
          <Button size="sm" outline color={importBtnDisabled ? "light" : "primary"} disabled={importBtnDisabled} onClick={this.onDoImport}>
            Import
          </Button>&nbsp;
        </div>
      </div>
    );
  }

} // class Help


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ImportExport;
