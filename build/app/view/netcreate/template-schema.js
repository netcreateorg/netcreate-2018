/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Template Schema

  The default schema is defined here.


  ##  BACKGROUND

      Template data is loaded by `server-database` DB.InitializeDatabase call.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const clone = require("rfdc")();

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MOD = {};

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

MOD.NODETYPEOPTIONS = {
  type: 'array',
  title: 'Node Types',
  format: 'table',
  options: {
    disable_collapse: true,
    disable_array_add: false,
    disable_array_delete: false,
    disable_array_delete_all_rows: true,
    disable_array_delete_last_row: true,
    disable_array_reorder: false
  }, // not editable
  items: {
    type: 'object',
    properties: {
      'color': {
        type: 'string',
        title: 'Color',
        format: 'color'
      },
      'label': {
        type: 'string',
        title: 'Label'
      }
    }
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

MOD.EDGETYPEOPTIONS = {
  type: 'array',
  title: 'Edge Types',
  format: 'table',
  options: {
    disable_collapse: true,
    disable_array_add: false,
    disable_array_delete: false,
    disable_array_delete_all_rows: true,
    disable_array_delete_last_row: true,
    disable_array_reorder: false
  }, // not editable
  items: {
    type: 'object',
    properties: {
      'color': { // currently unused
        type: 'string',
        title: 'Color',
        format: 'color'
      },
      'label': {
        type: 'string',
        title: 'Label'
      },
    }
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ Main NetCreate Schema Template
    This references the NODETYPEOPTIONS and EGETYPEOPTIONS above to define
    options.
/*/
MOD.TEMPLATE = {
  title: 'NetCreate Template',
  type: 'object',
  properties: {
    "name": {
      type: 'string',
      description: 'A short descriptive title for the project.  This is displayed on the graph view.  It can contain spaces.  e.g. "Alexander the Great"',
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
      format: 'checkbox',
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
    "templateIsLockedMessage": {
      type: 'string',
      description: 'Warning message to display if user is trying to edit a node or edge while the template is being edited.',
      default: 'The template is currently being edited, please try again later.'
    },
    "nodeDefaultTransparency": {
      type: 'number',
      description: 'Default transparency for nodes.',
      default: 1.0
    },
    "edgeDefaultTransparency": {
      type: 'number',
      description: 'Default transparency for edges.',
      default: 0.3
    },
    "searchColor": {
      type: 'string',
      description: 'Outline color of nodes selected via search.',
      default: '#008800',
      format: 'color'
    },
    "sourceColor": {
      type: 'string',
      description: 'Outline color of node highlighted during auto complete.',
      default: '#FFa500',
      format: 'color'
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
            },
            "hidden": {
              type: 'boolean',
              // not editable
              options: { hidden: true },
              format: 'checkbox',
              default: false
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
            },
            "hidden": {
              type: 'boolean',
              // not editable
              options: { hidden: true },
              format: 'checkbox',
              default: false
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
            "options": MOD.NODETYPEOPTIONS
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
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Date and time node was created'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
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
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Date and time node was last modified'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: false
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
            "hidden": {
              type: 'boolean',
              // not editable
              options: { hidden: true },
              format: 'checkbox',
              default: false
            }
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
            },
            "hidden": {
              type: 'boolean',
              // not editable
              options: { hidden: true },
              format: 'checkbox',
              default: false
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
            },
            "hidden": {
              type: 'boolean',
              // not editable
              options: { hidden: true },
              format: 'checkbox',
              default: false
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
            "options": MOD.EDGETYPEOPTIONS
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
        "category": { // Signficance
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"category" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Category'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Category'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Category (deprecated)'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              default: true
            }
          }
        },
      }
    }
  }
}



/// SCHEMA METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Schema definition for the Type Editor UI
    This introduces a wrapper around the Node or Edge Type Schema to provide
    extra UI elements for managing Type changes.
    * Map deleted types to another type
/*/
MOD.GetTypeEditorSchema = schemaTypeOptions => {
  const typeOptions = clone(schemaTypeOptions);
  try {
    typeOptions.options.disable_array_delete = true;
    typeOptions.items.properties.label.options = {
      // For some reason inputAttribute 'disabled' does not work here
      // so we use a className to mark the field
      // then in Temlate.onEditNodeTypes we set the
      // disabled property via js
      inputAttributes: { class: 'disabledField' }
    };
    typeOptions.items.properties.replacement = {
      type: 'string',
      title: 'Change To'
    };
    typeOptions.items.properties.delete = {
      type: 'boolean',
      title: 'Delete?',
      format: 'checkbox'
    };
  } catch (err) {
    console.error('GetTypeEditorSchema Error:', err);
  }
  return {
    title: 'Edit Type Options',
    type: 'object',
    description: 'NOTE that labels are case-sensitive, so "Person" is different from "person"',
    options: {
      disable_array_add: true,
      disable_array_delete: true,
      disable_array_delete_all_rows: true,
      disable_array_delete_last_row: true,
      disable_array_reorder: true,
      disable_collapse: true,
      disable_properties: true
    }, // not editable
    properties: {
      "options": typeOptions
    }
  }
}


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
