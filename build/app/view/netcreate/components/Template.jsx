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
const SCHEMA = require("../template-schema");

/// CONSTANTS /////////////////////////////////////////////////////////////////

let EDITOR; // json-editor object
let typeOptions;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Template extends UNISYS.Component {
  constructor (props) {
    super(props);
    this.state = {
      disableEdit: false,
      isBeingEdited: false,
      editScope: undefined, // root, nodeTypeOptions, edgeTypeOptions
      tomlfile: undefined,
      tomlfileStatus: '',
      tomlfileErrors: undefined
    };
    this.loadEditor = this.loadEditor.bind(this);
    this.updateEditState = this.updateEditState.bind(this);
    this.releaseOpenEditor = this.releaseOpenEditor.bind(this);
    this.onNewTemplate = this.onNewTemplate.bind(this);
    this.onCurrentTemplateLoad = this.onCurrentTemplateLoad.bind(this);
    this.onEditNodeTypes = this.onEditNodeTypes.bind(this);
    this.onEditEdgeTypes = this.onEditEdgeTypes.bind(this);
    this.onTOMLfileSelect = this.onTOMLfileSelect.bind(this);
    this.onDownloadTemplate = this.onDownloadTemplate.bind(this);
    this.onSaveChanges = this.onSaveChanges.bind(this);
    this.onCancelEdit = this.onCancelEdit.bind(this);

    UDATA = UNISYS.NewDataLink(this);
    UDATA.OnAppStateChange("OPENEDITORS", this.updateEditState);

  } // constructor

  componentDidMount() {
    this.updateEditState();
  }

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
    const schema = (parms && parms.schema) || SCHEMA.TEMPLATE;
    const startval = parms && parms.startval;

    const options = {
      theme: 'bootstrap4', // spectre, bootstrap3, tailwind, html
      disable_edit_json: true, // set to false allow direct viewing/editing of json for debugging
      disable_properties: false, // needed to allow user to add missing properties
      object_layout: 'table', // 'grid', 'grid-strict', 'categories'
      no_additional_properties: true, // prevent users from adding new non-schema properties
      schema
      // iconlib: 'fontawesome5', // fontawesome is not currently loaded
    };
    if (startval) options.startval = startval; // only add startval if its defined, otherwise you end up with an empty template
    if (EDITOR) EDITOR.destroy(); // clear any existing editor
    EDITOR = new JSONEditor(el, options);

    this.setState({ isBeingEdited: true });

    // Update OPENEDITORS
    UDATA.LocalCall("REGISTER_OPENEDITOR", { type: 'template' });
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  updateEditState() {
    let disableEdit = false;
    const openEditors = UDATA.AppState("OPENEDITORS").editors;
    if (openEditors.includes('node') ||
      openEditors.includes('edge')) {
      disableEdit = true;
    }
    this.setState({ disableEdit });
  }

  releaseOpenEditor() {
    // Remove 'template' from OPENEDITORS
    UDATA.LocalCall("DEREGISTER_OPENEDITOR", { type: 'template' });
  }

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
        const schemaNodeTypeOptions = SCHEMA.NODETYPEOPTIONS;
        // Wrap options in custom Schema to show Delete management UI
        const nodeTypeEditorSchema = SCHEMA.GetTypeEditorSchema(schemaNodeTypeOptions);
        // Remove default selected (blank) option
        // This is added back in in template-logic.UpdateTemplate after saving
        typeOptions = result.template.nodeDefs.type.options.filter(o => o.label !== '');
        const startval = { options: typeOptions }
        this.setState({ editScope: 'nodeTypeOptions' });
        this.loadEditor({
          schema: nodeTypeEditorSchema,
          startval
        });
        // HACK:  Lock edit fields so original labels are not changed
        // ClassName added in template-schema.GetTypeEditorSchema()
        const origLabelFields = document.getElementsByClassName('disabledField');
        origLabelFields.forEach(f => { f.disabled = true });

        // Not needed anymore, but keep for reference
        //
        // // Handle Delete Events
        // EDITOR.on('deleteRow', editor => {
        //   const val = EDITOR.getValue();
        //   const currentOptions = val ? val.options : [];
        //   console.log('currentOptions', currentOptions);
        //   typeOptionsRemoved = []; // start from scratch each time
        //   typeOptions.forEach(o => {
        //     if (!currentOptions.find(c => c.label === o.label)) typeOptionsRemoved.push(o);
        //   });
        //   console.log('removed options', typeOptionsRemoved);
        //   const deletions = EDITOR.getEditor('root.deletions');
        //   if (deletions) deletions.setValue(typeOptionsRemoved);
        //
        //   // key is 0 for first row
        //   // editor and key are undefined for last row
        //   // console.log('deleteRow', editor && editor.key)
        //   // const deletions = EDITOR.getEditor('root.deletions');
        //   // if (deletions) deletions.setValue([{ label: 'yo', color: '#ffffff' }]);
        //   // EDITOR.setValue({ deleted: 'yes' });
        // });
        //
        //
        // watch one
        // root.1 refers to second field, fields are 0-indexed
        // EDITOR.watch('root.1.label', (e) => {
        //   // `e` is undefined
        //   console.log('change', e);
        // });
        //
        // watch ALL
        // works but watches too much?
        // const watcherCallback = function (path) {
        //   console.log(`field with path: [${path}] changed to [${JSON.stringify(this.getEditor(path).getValue())}]`);
        //   // Do something
        // }
        // for (let key in EDITOR.editors) {
        //   if (EDITOR.editors.hasOwnProperty(key) && key !== 'root') {
        //     EDITOR.watch(key, watcherCallback.bind(EDITOR, key));
        //   }
        // }

      })
  }

  onEditEdgeTypes() {
    UDATA.LocalCall('EDIT_CURRENT_TEMPLATE') // nc-logic
      .then(result => {
        const schemaEdgeTypeOptions = SCHEMA.EDGETYPEOPTIONS;
        // Wrap options in custom Schema to show Delete management UI
        const edgeTypeEditorSchema = SCHEMA.GetTypeEditorSchema(schemaEdgeTypeOptions);
        // Remove default selected (blank) option
        // This is added back in in template-logic.UpdateTemplate after saving
        typeOptions = result.template.edgeDefs.type.options.filter(o => o.label !== '');
        const startval = { options: typeOptions }
        this.setState({ editScope: 'edgeTypeOptions' });
        this.loadEditor({
          schema: edgeTypeEditorSchema,
          startval
        });
        // HACK:  Lock edit fields so original labels are not changed
        // ClassName added in template-schema.GetTypeEditorSchema()
        const origLabelFields = document.getElementsByClassName('disabledField');
        origLabelFields.forEach(f => { f.disabled = true });
      });
  }

  onTOMLfileSelect(e) { // import
    const tomlfile = e.target.files[0];
    UDATA.LocalCall('VALIDATE_TOMLFILE', { tomlfile }) // nc-logic
      .then(result => {
        if (result.isValid) {
          this.setState({
            editScope: 'root'
          });
          this.loadEditor({
            schema: SCHEMA.TEMPLATE,
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

  onSaveChanges() {
    const templateJSON = EDITOR.getValue(); // could be a snippet
    const { editScope } = this.state;
    const template = TEMPLATE_LOGIC.UpdateTemplate(templateJSON, editScope);
    TEMPLATE_LOGIC.SaveTemplateToFile(template)
      .then(result => {
        if (!result.OK) {
          alert(result.info);
        } else {
          this.setState({ isBeingEdited: false });
        }
      });
    this.releaseOpenEditor();
  }

  onCancelEdit() {
    this.setState({ isBeingEdited: false });
    this.releaseOpenEditor();
  }


  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const {
      disableEdit,
      isBeingEdited,
      tomlfile,
      tomlfileStatus,
      tomlfileErrors
    } = this.state;
    let jsx;
    if (disableEdit) {
      // Node or Edge is being edited, show disabled message
      jsx = (
        <div>
          <p>Please finish editing the node or edge.</p>
          <p>Templates cannot be edited while a node or edge
            is being edited.  </p>
        </div>
      )
    } else {
      // OK to Edit, show edit buttons
      jsx = (
        <div hidden={isBeingEdited}>
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
              <i className="small text-muted">Import TOML template (replace existing)</i><br/>
              <label>
                <input type="file" accept="text/toml" id="tomlfileInput" onChange={this.onTOMLfileSelect}/>
                &nbsp;<i>{tomlfileStatus}</i><br />
                {tomlfileErrors && <span style={{ color: "red" }}>{tomlfileErrors}</span>}
              </label><br />
            </div>
          </div>
          <hr />
        </div>
      )
    }
    return (
      <div
        style={{
          backgroundColor: 'rgba(240,240,240,0.95)',
          padding: '10px 20px'
        }}
      >
        {jsx}
        <div hidden={!isBeingEdited} >
          <Button
            onClick={this.onCancelEdit}
            size="sm" outline
          >Cancel</Button>
          &nbsp;
          <Button
            onClick={this.onSaveChanges}
            size="sm" color="primary"
          >Save Changes</Button>
          <hr />
        </div>
        <div id="editor" hidden={!isBeingEdited}></div>
      </div>
    );
  }

} // class Help


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Template;
