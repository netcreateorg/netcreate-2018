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

/*/ Update TEMPLATE AppState
    `templateSnippet` can be the whole template object, or just the node types or
    edge types.
/*/
MOD.UpdateTemplate = (templateSnippet, editScope) => {
  let TEMPLATE = UDATA.AppState('TEMPLATE');
  if (editScope === 'root') TEMPLATE = templateSnippet;
  if (editScope === 'nodeTypeOptions') TEMPLATE.nodeDefs.type.options = templateSnippet;
  if (editScope === 'edgeTypeOptions') TEMPLATE.edgeDefs.type.options = templateSnippet;
  UDATA.SetAppState("TEMPLATE", TEMPLATE);
  return TEMPLATE;
}

/*/ Save template file to disk
    in case we do not necessarily want to autosave template data
    This calls: datastore > server > server-database
/*/
MOD.SaveTemplateToFile = template => {
  return DATASTORE.SaveTemplateFile(template);
}

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
