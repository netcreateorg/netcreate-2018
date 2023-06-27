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

  Templates can only be edited if:
  * There are no nodes or edges being edited
  * No one is trying to import data
  * There are no other templates being edited

  Conversely, if a Template is being edited, Import, Node and Edge editing
  will be disabled.

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
const { EDITORTYPE } = require("system/util/enum");
const SCHEMA = require("../template-schema");
const TEMPLATE_MGR = require('../templateEditor-mgr');

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
      editScope: undefined, // Determines whether the user is tring to edit the
                            // template's root (everything in the template),
                            // or just focused on a subsection: nodeTypeOptions,
                            // edgeTypeOptions
      tomlfile: undefined,
      tomlfileStatus: '',
      tomlfileErrors: undefined
    };
    this.loadEditor = this.loadEditor.bind(this);
    this.updateEditState = this.updateEditState.bind(this);
    this.disableOrigLabelFields = this.disableOrigLabelFields.bind(this);
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
    UDATA.HandleMessage("EDIT_PERMISSIONS_UPDATE", this.updateEditState);

  } // constructor

  componentDidMount() {
    this.updateEditState();
  }

  componentWillUnmount() {
    if (EDITOR) EDITOR.destroy();
    this.releaseOpenEditor();
    UDATA.UnhandleMessage("EDIT_PERMISSIONS_UPDATE", this.updateEditState);
  }

  /// METHODS /////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Load JSON Editor
   * -- If schema is not defined, the default schema is used
   * -- If startval is not defined, an empty template created from the default
   *    schema is used.
   * @param {object} parms { schema, startval }
   * @param {function} cb - Callback function
   */
  loadEditor(parms, cb) {
    UDATA.NetCall("SRV_REQ_EDIT_LOCK", { editor: EDITORTYPE.TEMPLATE })
      .then(data => {
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

        if (cb === undefined || typeof cb !== 'function') return;
        cb();
      });
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  updateEditState() {
    // disable edit if someone else is editing a template, node, or edge
    let disableEdit = false;
    UDATA.NetCall("SRV_GET_EDIT_STATUS")
      .then(data => {
        // someone else might be editing a template or importing or editing node or edge
        disableEdit = data.templateBeingEdited || data.importActive || data.nodeOrEdgeBeingEdited;
        this.setState({ disableEdit });
      });
  }

  // When editing Node or Edge Type Options, the original label field should be
  // disabled so they can't be edited
  // ClassName added in template-schema.GetTypeEditorSchema()
  disableOrigLabelFields() {
    const origLabelFields = document.getElementsByClassName('disabledField');
    origLabelFields.forEach(f => f.setAttribute("disabled", "disabled"));
  }

  releaseOpenEditor() {
    UDATA.NetCall("SRV_RELEASE_EDIT_LOCK", { editor: EDITORTYPE.TEMPLATE});
  }

  onNewTemplate() {
    this.setState({ editScope: 'root', isBeingEdited: true });
    this.loadEditor(); // new blank template with default schema
  }

  onCurrentTemplateLoad(e) {
    UDATA.LocalCall('EDIT_CURRENT_TEMPLATE') // nc-logic
      .then(result => {
        this.setState({ editScope: 'root', isBeingEdited: true });
        this.loadEditor({ startval: result.template });
      })
  }

  onEditNodeTypes() {
    UDATA.LocalCall('EDIT_CURRENT_TEMPLATE') // nc-logic
      .then(result => {
        const schemaNodeTypeOptions = SCHEMA.NODETYPEOPTIONS;
        // Wrap options in custom Schema to show Delete management UI
        const nodeTypeEditorSchema = SCHEMA.GetTypeEditorSchema(schemaNodeTypeOptions);
        const startval = { options: result.template.nodeDefs.type.options };
        this.setState({ editScope: 'nodeTypeOptions', isBeingEdited: true });
        this.loadEditor(
          {
            schema: nodeTypeEditorSchema,
            startval
          }, () => {
            this.disableOrigLabelFields();
            // HACK: After a row is added, we need to also disable the newly added
            // "Label" field -- the new label should be added in the "Change To" field
            EDITOR.on('addRow', editor => {
              this.disableOrigLabelFields();
            });
          }
        );
      })
  }

  onEditEdgeTypes() {
    UDATA.LocalCall('EDIT_CURRENT_TEMPLATE') // nc-logic
      .then(result => {
        const schemaEdgeTypeOptions = SCHEMA.EDGETYPEOPTIONS;
        // Wrap options in custom Schema to show Delete management UI
        const edgeTypeEditorSchema = SCHEMA.GetTypeEditorSchema(schemaEdgeTypeOptions);
        const startval = { options: result.template.edgeDefs.type.options };
        this.setState({ editScope: 'edgeTypeOptions', isBeingEdited: true });
        this.loadEditor({
          schema: edgeTypeEditorSchema,
          startval
        }, () => {
            this.disableOrigLabelFields();
            // HACK: After a row is added, we need to also disable the newly added
            // "Label" field -- the new label should be added in the "Change To" field
            EDITOR.on('addRow', editor => {
              this.disableOrigLabelFields();
            });
          }
        );
      });
  }

  onTOMLfileSelect(e) { // import
    const tomlfile = e.target.files[0];
    TEMPLATE_LOGIC.ValidateTOMLFile({ tomlfile })
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
    let editorjsx;
    if (disableEdit && !isBeingEdited) {
      // Node or Edge is being edited, show disabled message
      editorjsx = (
        <div>
          <p><i>Templates cannot be edited while someone is editing a node, edge,
            or template, or importing data.</i></p>
          <p><i>Please finish editing and try again.</i></p>
        </div>
      )
    } else {
      // OK to Edit, show edit buttons
      editorjsx = (
        <div hidden={isBeingEdited}>
          <p><b>PROCEED WITH CAUTION!</b>: Editing templates will modify the data
            in your dataset and may leave your dataset in an unusable state.
            Only <b>expert users</b> who know how the data is set up should do this.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            columnGap: '10px', rowGap: '5px'
          }}>
            <i className="small text-muted">Edit Current Template Options</i><br/>
            <Button size="sm" onClick={this.onEditNodeTypes}>
              Edit Node Types
            </Button>
            <Button size="sm" onClick={this.onEditEdgeTypes}>
              Edit Edge Types
            </Button>
            <p></p><p></p>
            <hr /><hr />
            <p>ADVANCED USERS ONLY</p><p></p>
            <i className="small text-muted">Edit Current Template</i><br/>
            <Button size="sm" onClick={this.onCurrentTemplateLoad}>
              Edit Current Template
            </Button>
            <Button outline size="sm" onClick={this.onDownloadTemplate}>
              Download Current Template
            </Button>
            <p></p><p></p>
            <i className="small text-muted">Create New Template</i><br/>
            <Button size="sm" onClick={this.onNewTemplate}>
              New Template
            </Button>
            <div>
              <i className="small text-muted">Import TOML template (replace existing template)</i><br/>
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
        {editorjsx}
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


// NOTES on using json-editor
        // Not needed anymore, but keep for reference for managing json-editor
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

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Template;
