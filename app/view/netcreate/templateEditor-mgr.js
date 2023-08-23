/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Template Editor Manager

  Client-side

  This handles the UI logic for the "Edit Template" subpanel on the "More..."
  tab.

  The actual template loading is handled by `server-database.js`.

  The internal template representation is JSON.
  The template definition itself is stored as a TOML file, which is then
  converted to JSON when loaded.

  The default json-editor schema is defined in `template-schema.js`


  ##  BACKGROUND

  Template data is loaded by `server-database` DB.InitializeDatabase call.

  With Version 1.4 of NetCreate, we introduce a new TOML template format that
  is easier to work with directly.
  * If you open a project that does not have a TOML template, the app will
    try to load the old JSON version and convert it.  See
    server-database.m_LoadJSONTemplate() and m_MigrateJSONtoTOML().
  * If you try to load a TOML template that is missing some key fields
    (e.g. error message definitions), then the app will fall back on
    fields defined in the schema.  See server-database.m_LoadTOMLTemplate()).


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require('unisys/client');
const TOML = require('@iarna/toml');
const DATASTORE = require('system/datastore');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

///////////////////////////////////////////////////////////////////////////////
/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
///

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Used when importing a TOML file
    Makes sure TOML file is readable.
    Returns JSON
/*/
MOD.ValidateTOMLFile = async data => {
  const { tomlfile } = data;
  try {
    let tomlText = await tomlfile.text();
    const json = TOML.parse(tomlText);
    const isValid = true;
    return { isValid, templateJSON: json };
  } catch (err) {
    return { isValid: false, error: err };
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update TEMPLATE AppState
    Called by Template.jsx to update the template data with the info from the form.
    Mostly used to process whether the form is:
    a) updating the whole template data, or
    b) updating only node types, or
    c) updateing only edge types

    IMPORTANT: Does NOT save the template or SetAppState!  Use SaveTemplateFile!
      SaveTemplateFile will trigger a TEMPLATE state update.
      Generally you won't call UpdateTemplate without a followup call to
      SaveTemplateFile.

    MAJOR SIDE EFFECT: Updates NCDATA with changes!
    `templateSnippet` can be the whole template object, or just the node types or
    edge types.
/*/
MOD.UpdateTemplate = (templateSnippet, editScope) => {
  let TEMPLATE = UDATA.AppState('TEMPLATE');

  // a) Replace whole template?
  if (editScope === 'root') TEMPLATE = templateSnippet;

  // b) Replace NODE type options?
  if (editScope === 'nodeTypeOptions') {
    // 1. Clean/validate -- Remove any extra empty labels
    //    Added Rows will have a blank 'label' but a non-blank 'replacement'
    let numOfEmptyLabels = 0;
    TEMPLATE.nodeDefs.type.options = templateSnippet.options.filter(o => {
      // if there's a replacement, always add it
      if (o.replacement !== '') return true;
      // if the label is blank...
      if (o.label === '') {
        if (numOfEmptyLabels < 1) {
          // ... and there has only been one, add it
          numOfEmptyLabels++;
          return true;
        } else {
          // ... otherwise, remove extras
          return false;
        }
      }
      // keep all other adjustments
      return true;
    });
    // 2. Update NCDATA with new types
    UDATA.LocalCall('NODE_TYPES_UPDATE', {
      nodeTypesChanges: templateSnippet.options
    });
    // 3. Remove Types marked for deletion
    TEMPLATE.nodeDefs.type.options = TEMPLATE.nodeDefs.type.options.filter(
      o => !o.delete
    );
    // 4. Update types with replacement labels
    TEMPLATE.nodeDefs.type.options = TEMPLATE.nodeDefs.type.options.map(o => {
      if (o.replacement) {
        o.label = o.replacement;
        o.replacement = '';
      }
      return o;
    });
  }

  // c) Replace EDGE type options?
  if (editScope === 'edgeTypeOptions') {
    // 1. Clean/validate -- Remove any extra empty labels
    //    Added Rows will have a blank 'label' but a non-blank 'replacement'
    let numOfEmptyLabels = 0;
    TEMPLATE.edgeDefs.type.options = templateSnippet.options.filter(o => {
      // if there's a replacement, always add it
      if (o.replacement !== '') return true;
      // if the label is blank...
      if (o.label === '') {
        if (numOfEmptyLabels < 1) {
          // ... and there has only been one, add it
          numOfEmptyLabels++;
          return true;
        } else {
          // ... otherwise, remove extras
          return false;
        }
      }
      // keep all other adjustments
      return true;
    });
    // 2. Update NCDATA with new types
    UDATA.LocalCall('EDGE_TYPES_UPDATE', {
      edgeTypesChanges: templateSnippet.options
    });
    // 3. Remove Types marked for deletion
    TEMPLATE.edgeDefs.type.options = TEMPLATE.edgeDefs.type.options.filter(
      o => !o.delete
    );
    // 4. Update types with replacements
    TEMPLATE.edgeDefs.type.options = TEMPLATE.edgeDefs.type.options.map(o => {
      if (o.replacement) {
        o.label = o.replacement;
        o.replacement = '';
      }
      return o;
    });
  }
  // This call is redundant.  SaveTemplateToFile will trigger a state update.
  // UDATA.SetAppState("TEMPLATE", TEMPLATE);
  return TEMPLATE;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Save template file to disk
    in case we do not necessarily want to autosave template data
    This calls: datastore > server > server-database
/*/
MOD.SaveTemplateToFile = template => {
  return DATASTORE.SaveTemplateFile(template);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Download template to local file
/*/
MOD.DownloadTemplate = () => {
  DATASTORE.GetTemplateTOMLFileName() // datastore > server > server-database
    .then(data => {
      const filename = data.filename;
      const TEMPLATE = UDATA.AppState('TEMPLATE');
      const toml = TOML.stringify(TEMPLATE);
      const link = document.createElement('a');
      const blob = new Blob(['\ufeff', toml]);
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link); // Required for FF
      link.click();
      document.body.removeChild(link);
    });
};

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
