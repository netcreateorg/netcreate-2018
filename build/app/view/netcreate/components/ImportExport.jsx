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
    this.state = {isExpanded: true};
    this.onSelectExportNodes = this.onSelectExportNodes.bind(this);
    this.onSelectExportEdges = this.onSelectExportEdges.bind(this);
    this.onSelectImportNodes = this.onSelectImportNodes.bind(this);
    this.onSelectImportEdges = this.onSelectImportEdges.bind(this);

    UDATA = UNISYS.NewDataLink(this);
  } // constructor

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  onSelectExportNodes() { UDATA.LocalCall('EXPORT_NODES'); }
  onSelectExportEdges() { UDATA.LocalCall('EXPORT_EDGES'); }

  onSelectImportNodes() { }

  onSelectImportEdges() { }

/// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    return (
      <div
        className="help"
        style={{
          width: '50%',
          maxWidth: '50%',
          overflow: 'scroll',
          position: 'fixed',
          right: '10px',
          zIndex: '3000'
        }}
      >
        <div
          hidden={!this.state.isExpanded}
          style={{
            backgroundColor: 'rgba(240,240,240,0.95)',
            padding: '10px 20px'
          }}
        >
          <h1>Export Data</h1>

          <Button size="sm" outline onClick={this.onSelectExportNodes}>
            Export Nodes
          </Button>&nbsp;
          <Button size="sm" outline onClick={this.onSelectExportEdges}>
            Export Edges
          </Button>&nbsp;
          <i className="small text-muted">Export data in .csv format.</i>

          <hr />

          <h1>Import Data</h1>

          <Button size="sm" outline onClick={this.onSelectExportNodes}>
            Import Nodes
          </Button>&nbsp;
          <Button size="sm" outline onClick={this.onSelectExportNodes}>
            Import Edges
          </Button>&nbsp;
          <i className="small text-muted">Import .csv data</i>
        </div>
      </div>
    );
  }

} // class Help


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ImportExport;
