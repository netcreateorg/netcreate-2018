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
    this.state = {
      isExpanded: true,
      nodefile: undefined,
      nodefileStatus: NODEFILESTATUS_DEFAULT,
      nodefileErrors: undefined,
      edgefile: undefined,
      edgefileStatus: EDGEFILESTATUS_DEFAULT,
      edgefileErrors: undefined,
      importErrors: undefined,
      importMsgs: undefined
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
            nodefileErrors: undefined
            // node does not clear importErrors because errors come from edges
          });
        } else {
          if (result.missingKeys.length > 0) {
            // user selected file with missing keys
            this.setState({
              nodefile: undefined,
              nodefileStatus: 'Invalid nodes csv file!!!',
              nodefileErrors: (
                <div>
                  <div>Missing keys: {result.missingKeys.join(', ')}</div>
                  <div>Keys found in file: {result.fileKeys.join(', ')}</div>
                </div>
              )
              // node does not clear importErrors because errors come from edges
            });
          } else {
            // User Cancelled, reset to default
            this.setState({
              nodefile: undefined,
              nodefileStatus: NODEFILESTATUS_DEFAULT,
              nodefileErrors: undefined
              // node does not clear importErrors because errors come from edges
          });
          }
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
            importErrors: undefined,
            importMsgs: undefined
          });
        } else {
          if (result.missingKeys.length > 0) {
            // user selected file with missing keys
            this.setState({
              edgefile: undefined,
              edgefileStatus: "Invalid edges csv file!!!",
              edgefileErrors: (
                <div>
                  <div>Missing keys: {result.missingKeys.join(', ')}</div>
                  <div>Keys found in file: {result.fileKeys.join(', ')}</div>
                </div>
              )
            });
          } else {
            // User Cancelled, reset to default
            this.setState({
              edgefile: undefined,
              edgefileStatus: EDGEFILESTATUS_DEFAULT,
              edgefileErrors: undefined,
              importErrors: undefined,
              importMsgs: undefined
            });
          }
        }
      });
  }

  onDoImport() {
    UDATA.LocalCall('IMPORT').then(result => {
      if (result.error) {
        this.setState({
          importErrors: result.error && (
            <div>IMPORT ERROR: File(s) not imported.<br />
              <ul>{result.error.map((e, i) => (<li key={i}>{e}</li>))}</ul>
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
          edgefile: undefined,
          edgefileStatus: EDGEFILESTATUS_DEFAULT,
          edgefileErrors: undefined,
          importErrors: undefined,
          importMsgs: result.messages && (
            <div>IMPORT NOTES:<br />
              <ul>{result.messages.map((e, i) => (<li key={i}>{e}</li>))}</ul>
            </div>)
        });
        document.getElementById('nodefileInput').value = "";
        document.getElementById('edgefileInput').value = "";
      }
    }); // nc-logic -> export-logic
  }


/// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const {
      nodefile,
      nodefileStatus,
      nodefileErrors,
      edgefile,
      edgefileStatus,
      edgefileErrors,
      importErrors,
      importMsgs
    } = this.state;

    const ISADMIN = SETTINGS.IsAdmin();
    const isLoggedIn = NetMessage.GlobalGroupID();
    const importDisabled = !(ISADMIN || isLoggedIn);

    const importBtnDisabled = (!nodefile && !edgefile) ||
      nodefileErrors !== undefined ||
      edgefileErrors !== undefined ||
      importErrors !== undefined;

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
            <input type="file" accept="text/csv" id="edgefileInput" onChange={this.onEdgeImportFileSelect}/>
            &nbsp;<i>{edgefileStatus}</i><br />
            {edgefileErrors && <span style={{ color: "red" }}>{edgefileErrors}</span>}
          </label><br />
          {importErrors && <div style={{ color: "red" }}>{importErrors}</div>}
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
