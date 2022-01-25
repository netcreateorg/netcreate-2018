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

const SCHEMA_NODETYPEOPTIONS = {
  type: 'array',
  title: 'Node Types',
  format: 'table',
  items: {
    type: 'object',
    properties: {
      'id': {
        type: 'string'
      },
      'label': {
        type: 'string'
      },
      'color': {
        type: 'string',
        format: 'color'
      }
    }
  }
};
const SCHEMA_EDGETYPEOPTIONS = {
  type: 'array',
  format: 'table',
  items: {
    type: 'object',
    properties: {
      'id': {
        type: 'string'
      },
      'label': {
        type: 'string'
      },
      'color': { // currently unused
        type: 'string',
        format: 'color'
      }
    }
  }
}
const SCHEMA = {
  title: 'NetCreate Template',
  type: 'object',
  properties: {
    "name": {
      type: 'string',
      description: 'Template Name',
      default: 'Untitled Template'
    },
    "description": {
      type: 'string',
      description: 'Short description of the project, e.g. "This is based on the Secret Histories of Prokopios"',
      default: 'No Description'
    },
    "citation": {
      type: 'object',
      description: 'Citation meta data',
      properties: {
        "text": {
          type: 'string',
          description: 'Bibliographic reference',
          options: {
            inputAttributes: { placeholder: 'Untitled Network' }
          }
        },
        "hidden": {
          type: 'boolean',
          format: 'checkbox',
          default: false
        }
      }
    },
    "requireLogin": {
      type: 'boolean',
      format: 'checkbox',
      default: false
    },
    "hideDeleteNodeButton": {
      // Normally, only admins can delete nodes.  You're an admin if:
      // -- is localhost (e.g. IP is 127.0.0.71)
      // -- or has `?admin=true` GET parameter
      // This will force hide the delete button even if you're an admin
      type: 'boolean',
      description: 'Always hide Node delete button, even for admins.',
      default: false
    },
    "duplicateWarning": {
      type: 'string',
      description: 'Warning message to display if user is trying to create a node that already exists.',
      default: 'You’re entering a duplicate node.  Do you want to View the Existing node, or Continue creating?'
    },
    "nodeIsLockedMessage": {
      type: 'string',
      description: 'Warning message to display if user is trying to edit a node that someone is already editing.',
      default: 'This node is currently being edited by someone else, please try again later.'
    },
    "edgeIsLockedMessage": {
      type: 'string',
      description: 'Warning message to display if user is trying to edit an edge that someone is already editing.',
      default: 'This edge is currently being edited by someone else, please try again later.'
    },
    "nodeDefaultTransparency": {
      type: 'number',
      description: 'Default transparency for nodes.',
      default: 0.1
    },
    "edgeDefaultTransparency": {
      type: 'number',
      description: 'Default transparency for edges.',
      default: 0.3
    },
    "nodeDefs": {
      properties: {
        "id": {
          type: 'object',
          description: 'System-generated unique id number',
          properties: {
            "type": {
              type: 'number',
              // not editable
              options: { hidden: true },
              description: '"id" data type',
              default: 'number'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Id'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'ID'
            },
            "help": {
              type: 'string',
              // not editable
              options: { hidden: true },
              description: 'Help text to display on the Node Editor form',
              default: 'System-generated unique id number'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "id" value in tooltip on graph',
              default: true
            }
          }
        },
        "label": {
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              // not editable
              options: { hidden: true },
              description: '"label" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'label'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Label'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Display name of the node'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "label" value in tooltip on graph',
              default: true
            }
          }
        },
        "type": {
          type: 'object',
          description: 'Enumerated node types',
          properties: {
            "type": {
              type: 'string',
              // not editable
              options: { hidden: true },
              description: 'node "type" data type',
              default: 'select'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Type'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'NodeType' // matches Gephi
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Multiple people are a "Group"'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "type" value in tooltip on graph',
              default: true
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
            },
            "options": SCHEMA_NODETYPEOPTIONS
          }
        },
        "notes": { // Signficance
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"notes" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Significance'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Notes'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Display name of the node'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "notes" value in tooltip on graph',
              default: true
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
            }
          }
        },
        "info": { // Info/Number
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"info" data type',
              default: 'number'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Number'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Info'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Some number comparison'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "info" value in tooltip on graph',
              default: true
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
            }
          }
        },
        "degrees": { // Weight
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"degrees" data type',
              default: 'number'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Degrees'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Weight'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Number of edges connected to this node'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "degrees" value in tooltip on graph',
              default: true
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
            }
          }
        },
        "created": { // HACK setting.  Only used in d3-simplenetgraph tooltip.  Does not define a new data field.
          type: 'object',
          description: 'System-generated date.  This setting only used to show/hide tooltip in graph',
          properties: {
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Created'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Created'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "created" value in tooltip on graph',
              default: true
            }
          }
        },
        "updated": { // HACK setting.  Only used in d3-simplenetgraph tooltip.  Does not define a new data field.
          type: 'object',
          description: 'System-generated date.  This setting only used to show/hide tooltip in graph',
          properties: {
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Updated'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Updated'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "updated" value in tooltip on graph',
              default: true
            }
          }
        }
      }
    },
    "edgeDefs": {
      properties: {
        "id": {
          type: 'object',
          description: 'System-generated unique id number',
          properties: {
            "type": {
              type: 'number',
              // not editable
              options: { hidden: true },
              description: '"id" data type',
              default: 'number'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Id'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'ID'
            },
            "help": {
              type: 'string',
              // not editable
              options: { hidden: true },
              description: 'Help text to display on the Node Editor form',
              default: 'System-generated unique id number'
            },
          }
        },
        "source": {
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              // not editable
              options: { hidden: true },
              description: '"source" data type',
              default: 'number'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Source'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Source'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Edge source node'
            }
          }
        },
        "target": {
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              // not editable
              options: { hidden: true },
              description: '"target" data type',
              default: 'number'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Target'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Target'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Edge target node'
            }
          }
        },
        "type": {
          type: 'object',
          description: 'Enumerated edge types',
          properties: {
            "type": {
              type: 'string',
              // not editable
              options: { hidden: true },
              description: 'edge "type" data type',
              default: 'select'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Type'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'EdgeType' // matches Gephi?
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Type of edge connection'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
            },
            "options": SCHEMA_EDGETYPEOPTIONS
          }
        },
        "notes": { // Signficance
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"notes" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Significance'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Notes'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Significance of the connection'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
            }
          }
        },
        "info": { // Info/Number/Date
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"info" data type',
              default: 'number'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Date'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Date'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: '"YYYY-MM-DD" format"'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
            }
          }
        },
        "citation": { // Signficance
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"citation" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Citation'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Citation'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Source Book.Chapter (e.g. "Part 2 06.03")'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
            }
          }
        },
      }
    }
  }
}

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



/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// EXPORTs  //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
///
MOD.SCHEMA = {
  root: SCHEMA,
  nodeTypeOptions: SCHEMA_NODETYPEOPTIONS,
  edgeTypeOptions: SCHEMA_EDGETYPEOPTIONS
};



/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
