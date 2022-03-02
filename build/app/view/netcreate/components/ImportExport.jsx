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

const UNISYS   = require('unisys/client');


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class ImportExport extends UNISYS.Component {
  constructor (props) {
    super(props);
    this.state = {
      isExpanded: true,
      nodefile: undefined,
      nodefileStatus: 'Select a node .csv file to import',
      nodefileErrors: undefined,
      edgefile: undefined,
      edgefileStatus: 'Select an edge .csv file to import',
      edgefileErrors: undefined,
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
          });
        } else {
          const errorMsg = (
            <div>
              <div>Missing keys: {result.missingKeys.join(', ')}</div>
              <div>Keys found in file: {result.fileKeys.join(', ')}</div>
            </div>
          );
          this.setState({
            nodefile: undefined,
            nodefileStatus: 'Invalid nodes csv file!!!',
            nodefileErrors: errorMsg
          });
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
            edgefileErrors: undefined
          });
        } else {
          const errorMsg = (
            <div>
              <div>Missing keys: {result.missingKeys.join(', ')}</div>
              <div>Keys found in file: {result.fileKeys.join(', ')}</div>
            </div>
          );
          this.setState({
            edgefile: undefined,
            edgefileStatus: "Invalid edges csv file!!!",
            edgefileErrors: errorMsg
          });
        }
      });
  }

  onDoImport() {
    UDATA.LocalCall('UI_CLOSE_MORE'); // InfoPanel.jsx
    UDATA.LocalCall('IMPORT'); // nc-logic -> export-logic
    this.setState({ nodefile: undefined, edgefile: undefined }); // clear files for next import
  }


/// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const { nodefile,
      nodefileStatus,
      nodefileErrors,
      edgefile,
      edgefileStatus,
      edgefileErrors
    } = this.state;

    const importDisabled = false;

    return (
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

        <hr />

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
        <Button size="sm" outline color={importDisabled ? "light" : "primary"} disabled={importDisabled} onClick={this.onDoImport}>
          Import
        </Button>&nbsp;
      </div>
    );
  }

} // class Help


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ImportExport;
