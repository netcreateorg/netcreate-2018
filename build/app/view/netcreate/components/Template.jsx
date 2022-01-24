/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Template Editor View

  Displays a variety of tools to edit templates:
  * Edit Node Types
  * Edit Edge Types
  * Edit Current Template
  * Download Current Template
  * Create New Template
  * Import Template from File

  This is displayed on the More.jsx component/panel but can be moved
  anywhere.


  ##  BACKGROUND

      Template data is loaded by `server-database` DB.InitializeDatabase call.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;
var UDATA = null;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { Button } = ReactStrap;
import { JSONEditor } from '@json-editor/json-editor';
const UNISYS = require('unisys/client');
const TEMPLATE_LOGIC = require("../template-logic");

/// CONSTANTS /////////////////////////////////////////////////////////////////

let EDITOR; // json-editor object

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Template extends UNISYS.Component {
  constructor (props) {
    super(props);
    this.state = {
      isEditing: false,
      editScope: undefined, // root, nodeTypeOptions, edgeTypeOptions
      tomlfile: undefined,
      tomlfileStatus: '',
      tomlfileErrors: undefined
    };
    this.loadEditor = this.loadEditor.bind(this);
    this.onNewTemplate = this.onNewTemplate.bind(this);
    this.onCurrentTemplateLoad = this.onCurrentTemplateLoad.bind(this);
    this.onEditNodeTypes = this.onEditNodeTypes.bind(this);
    this.onEditEdgeTypes = this.onEditEdgeTypes.bind(this);
    this.onTOMLfileSelect = this.onTOMLfileSelect.bind(this);
    this.onDownloadTemplate = this.onDownloadTemplate.bind(this);
    this.onSaveEdit = this.onSaveEdit.bind(this);
    this.onCancelEdit = this.onCancelEdit.bind(this);

    UDATA = UNISYS.NewDataLink(this);
  } // constructor

  componentDidMount() { }

  componentWillUnmount() {
    if (EDITOR) EDITOR.destroy();
  }

  /// METHODS /////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Load JSON Editor
   * -- If schema is not defined, the default schema is used
   * -- If startval is not defined, an empty template created from the default
   *    schema is used.
   * @param {object} parms { schema, startval }
   */
  loadEditor(parms) {
    const el = document.getElementById('editor');
    const schema = (parms && parms.schema) || TEMPLATE_LOGIC.SCHEMA.root;
    const startval = parms && parms.startval;

    const options = {
      theme: 'bootstrap4', // spectre, bootstrap3, tailwind, html
      disable_edit_json: true, // set to false for debugging
      disable_properties: true, // set to false for debugging
      schema
      // iconlib: 'fontawesome5', // fontawesome is not currently loaded
    };
    if (startval) options.startval = startval; // only add startval if its defined, otherwise you end up with an empty template
    if (EDITOR) EDITOR.destroy(); // clear any existing editor
    EDITOR = new JSONEditor(el, options);

    this.setState({ isEditing: true });
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  onNewTemplate() {
    this.setState({
      editScope: 'root'
    });
    this.loadEditor(); // new blank template with default schema
  }

  onCurrentTemplateLoad(e) {
    UDATA.LocalCall('EDIT_CURRENT_TEMPLATE') // nc-logic
      .then(result => {
        console.error('template is', result);
        this.setState({
          editScope: 'root'
        });
        this.loadEditor({ startval: result.template });
      })
  }

  onEditNodeTypes() {
    UDATA.LocalCall('EDIT_CURRENT_TEMPLATE') // nc-logic
      .then(result => {
        console.error('template is', result);
        const schemaNodeTypeOptions = TEMPLATE_LOGIC.SCHEMA.nodeTypeOptions;
        console.error('schema is', schemaNodeTypeOptions)
        this.setState({
          editScope: 'nodeTypeOptions'
        });
        this.loadEditor(
          {
            schema: schemaNodeTypeOptions,
            startval: result.template.nodeDefs.type.options
          });
      })
  }

  onEditEdgeTypes() {
    UDATA.LocalCall('EDIT_CURRENT_TEMPLATE') // nc-logic
      .then(result => {
        const schemaEdgeTypeOptions = TEMPLATE_LOGIC.SCHEMA.edgeTypeOptions;
        console.error('schema is', schemaEdgeTypeOptions)
        this.setState({
          editScope: 'edgeTypeOptions'
        });
        this.loadEditor({
          schema: schemaEdgeTypeOptions,
          startval: result.template.edgeDefs.type.options
        });
      })
  }

  onTOMLfileSelect(e) {
    const tomlfile = e.target.files[0];
    UDATA.LocalCall('VALIDATE_TOMLFILE', { tomlfile }) // nc-logic
      .then(result => {
        if (result.isValid) {
          this.setState({
            editScope: 'root'
          });
          this.loadEditor({
            schema: TEMPLATE_LOGIC.SCHEMA.root,
            startval: result.templateJSON
          });
        } else {
          const errorMsg = result.error;
          this.setState({
            tomlfile: undefined,
            tomlfileStatus: "Invalid template file!!!",
            tomlfileErrors: errorMsg
          });
        }
      });
  }

  onDownloadTemplate() {
    TEMPLATE_LOGIC.DownloadTemplate();
  }

  onSaveEdit() {
    const templateJSON = EDITOR.getValue(); // could be a snippet
    const { editScope } = this.state;
    const template = TEMPLATE_LOGIC.UpdateTemplate(templateJSON, editScope);
    TEMPLATE_LOGIC.SaveTemplateToFile(template)
      .then(result => {
        if (!result.OK) {
          alert(result.info);
        } else {
          this.setState({ isEditing: false })
        }
      });
  }

  onCancelEdit() {
    this.setState({ isEditing: false });
  }


  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const {
      isEditing,
      tomlfile,
      tomlfileStatus,
      tomlfileErrors
    } = this.state;
    const importDisabled = tomlfile === undefined;
    return (
      <div
        style={{
          backgroundColor: 'rgba(240,240,240,0.95)',
          padding: '10px 20px'
        }}
      >
        <div hidden={isEditing}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            columnGap: '10px', rowGap: '5px'
          }}>
            {/* TYPE OPTIONS */}
            <Button size="sm" onClick={this.onEditNodeTypes}>
              Edit Node Types
            </Button>
            <Button size="sm" onClick={this.onEditEdgeTypes}>
              Edit Edge Types
            </Button>
            {/* CURRENT TEMPLATE */}
            <Button size="sm" onClick={this.onCurrentTemplateLoad}>
              Edit Current Template
            </Button>
            <Button size="sm" onClick={this.onDownloadTemplate}>
              Download Current Template
            </Button>
            {/* NEW TEMPLATE */}
            <Button size="sm" onClick={this.onNewTemplate}>
              New Template
            </Button>
            <div>
              <i className="small text-muted">Import template (replace existing)</i><br/>
              <label>
                <input type="file" accept="text/toml" id="tomlfileInput" onChange={this.onTOMLfileSelect}/>
                &nbsp;<i>{tomlfileStatus}</i><br />
                {tomlfileErrors && <span style={{ color: "red" }}>{tomlfileErrors}</span>}
              </label><br />
            </div>
          </div>
        </div>
        <hr />
        <div>
          <Button
            onClick={this.onCancelEdit}
            hidden={!isEditing} size="sm" outline
          >Cancel</Button>
          &nbsp;
          <Button
            onClick={this.onSaveEdit}
            hidden={!isEditing} size="sm" color="primary"
          >Save Changes</Button>
        </div>
        <hr />
        <div id="editor" hidden={!isEditing}></div>
      </div>
    );
  }

} // class Help


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Template;
