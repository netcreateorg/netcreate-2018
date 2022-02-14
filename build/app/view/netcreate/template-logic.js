/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Template Logic

  The default schema is defined here.


  ##  BACKGROUND

      Template data is loaded by `server-database` DB.InitializeDatabase call.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require("unisys/client");
const TOML = require("@iarna/toml");
const DATASTORE = require("system/datastore");

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

    MAJOR SIDE EFFECT: Updates D3DATA with changes!
    `templateSnippet` can be the whole template object, or just the node types or
    edge types.
/*/
MOD.UpdateTemplate = (templateSnippet, editScope) => {
  let TEMPLATE = UDATA.AppState('TEMPLATE');

  // a) Replace whole template?
  if (editScope === 'root') TEMPLATE = templateSnippet;

  // b) Replace NODE type options?
  if (editScope === 'nodeTypeOptions') {
    // 1. Clean/validate -- Remove any empty labels
    //    Added Rows will have a blank 'label' but a non-blank 'replacement'
    TEMPLATE.nodeDefs.type.options = templateSnippet.options.filter(o => {
      return (o.label !== '') || (o.label === '' && o.replacement !== '');
    });
    // 2. Update D3DATA with new types
    UDATA.LocalCall("NODE_TYPES_UPDATE", { nodeTypesChanges: templateSnippet.options });
    // 3. Remove Types marked for deletion
    TEMPLATE.nodeDefs.type.options = TEMPLATE.nodeDefs.type.options.filter(o => !o.delete);
    // 4. Update types with replacement labels
    TEMPLATE.nodeDefs.type.options = TEMPLATE.nodeDefs.type.options.map(o => {
      if (o.replacement) {
        o.label = o.replacement;
        o.replacement = "";
      }
      return o;
    });
    // 4. Validate: Make sure there are no other empty labels?
    // 5. Re-add default selected (blank) option
    TEMPLATE.nodeDefs.type.options.unshift({
      label: '', color: '#eeee'
    });
  }

  // c) Replace EDGE type options?
  if (editScope === 'edgeTypeOptions') {
    console.log('edgeTypeOptions: template snippet', templateSnippet)
    // 1. Clean/validate -- Remove any empty labels
    //    Added Rows will have a blank 'label' but a non-blank 'replacement'
    TEMPLATE.edgeDefs.type.options = templateSnippet.options.filter(o => {
      return (o.label !== '') || (o.label === '' && o.replacement !== '');
    });
    // 2. Update D3DATA with new types
    UDATA.LocalCall("EDGE_TYPES_UPDATE", { edgeTypesChanges: templateSnippet.options });
    // 3. Remove Types marked for deletion
    TEMPLATE.edgeDefs.type.options = TEMPLATE.edgeDefs.type.options.filter(o => !o.delete);
    // 4. Update types with replacements
    TEMPLATE.edgeDefs.type.options = TEMPLATE.edgeDefs.type.options.map(o => {
      if (o.replacement) {
        o.label = o.replacement;
        o.replacement = "";
      }
      return o;
    });
    // 4. Validate: Make sure there are no other empty labels?
    // 5. Re-add default selected (blank) option
    TEMPLATE.edgeDefs.type.options.unshift({
      label: '', color: '#eeee'
    });
  }
  // This call is redundant.  SaveTemplateToFile will trigger a state update.
  // UDATA.SetAppState("TEMPLATE", TEMPLATE);
  return TEMPLATE;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Save template file to disk
    in case we do not necessarily want to autosave template data
    This calls: datastore > server > server-database
/*/
MOD.SaveTemplateToFile = template => {
  return DATASTORE.SaveTemplateFile(template);
}

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
      const blob = new Blob(["\ufeff", toml]);
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link); // Required for FF
      link.click();
      document.body.removeChild(link);
    });
}


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
