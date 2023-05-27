/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Template Schema

  The Template Schema defines a spec for
  `[json-editor](https://github.com/json-editor/json-editor)`
  to generate a UI for editing the template.  It identifies the objects that
  the json-editor needs to support and provides meta data about how to
  display and handle the edits.

  `template-logic.js` handles initialization client-side.

  NOTE: This schema is NOT the same as the `toml` template file schema.  This
  schema is used by `json-editor` to know how to display a UI for editing the
  template itself.

  IMPORTANT: If you modify the schema, generate a new template by

    1. Start NetCreate
    2. In web browser developer console, run:

        `ncRegenerateDefaultTemplate()`
    3. This will create a new `_default.template.toml` file.

  Alternatively the default template's JSON can be generated from this schema spec by
  by calling MOD.ParseTemplateSchema() directly. This is the rough equivalent of doing this:
  1. Start NetCreate with a new db, e.g. `./nc.js --dataset=newdefault`
  2. Clicking "New Template" on the "More... > Edit Template" tab.
  3. Clicking "Save Changes"
  4. Copy the file to `netcreate-2018/build/app/assets/templates/`
  5. Renaming the saved template to `_default.template.toml`

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

/**
 * Node Type Schema
 * This is a subset of the full template schema.
 *
 * We pull it out separately so that Node Types can be edited by themselves
 * without having to scroll through the whole template.
 *
 * When editing the main Template, this is loaded as a subset of the main schema.
 * When editing node types, this is loaded by MOD.GetTypeEditorSchema to
 * provide additional UI elements to manage deleting and renaming
 * existing field types
 */
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

/**
 * Edge Type Schema
 * This is a subset of the full template schema.
 *
 * We pull it out separately so that Edge Types can be edited by themselves
 * without having to scroll through the whole template.
 *
 * When editing the main Template, this is loaded as a subset of the main schema.
 * When editing edge types, this is loaded by MOD.GetTypeEditorSchema to
 * provide additional UI elements to manage deleting and renaming
 * existing field types
 */
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
          description: 'Hides the "Cite Node" and "Cite Edge" buttons.',
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
      // This will force hide the delete button even if you're an admin.
      type: 'boolean',
      format: 'checkbox',
      description: 'Always hide Node delete button, even for admins.',
      default: false
    },
    "allowLoggedInUserToImport": {
      // Normally, only admins can import data.  You're an admin if:
      // -- is localhost (e.g. IP is 127.0.0.71)
      // -- or has `?admin=true` GET parameter
      // This will allow any logged in user to import data.
      type: 'boolean',
      format: 'checkbox',
      description: 'Allow any logged in user to import data.  Admins can always import data.',
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
      description: 'Warning message to display if user is trying to edit a node or edge or import while the template is being edited.',
      default: 'The template is currently being edited, please try again later.'
    },
    "importIsLockedMessage": {
      type: 'string',
      description: 'Warning message to display if user is trying to edit a node, edge, or template import is active.',
      default: 'Data is currently being imported, please try again later.'
    },
    "nodeDefaultTransparency": {
      type: 'number',
      description: 'Default transparency for nodes.',
      default: 1.0
    },
    "edgeDefaultTransparency": {
      type: 'number',
      description: 'Default transparency for edges.',
      default: 0.7
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
              format: 'checkbox',
              options: { hidden: true }, // not end-user editable, always hidden from Template Editor
              description: 'Not used.  "id" is always hidden.',
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
              options: { hidden: true }, // not end-user editable, always hidden from Template Editor
              description: 'Not used.  "label" is always shown.',
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
              description: 'Hides "type" from Node Editor, Nodes Table, and exports',
              default: false
            },
            "options": Object.assign({}, MOD.NODETYPEOPTIONS, { description: 'NOTE: We recommend using the "Edit Node Types" feature to edit Node Types.  It provides additional dataset migration tools.' })
          }
        },
        "notes": { // Significance
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
              description: 'Hides "notes" from Node Editor, Nodes Table, and exports',
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
              description: 'Hides "info" from Node Editor, Nodes Table, and exports',
              default: false
            }
          }
        },
        "provenance": { // Provenance/Source
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"provenance" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Provenance'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Provenance'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Who created this?  (aka Provenance)'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "provenance" value in tooltip on graph',
              default: true
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Hides "provenance" from Node Editor, Nodes Table, and exports',
              default: false
            }
          }
        },
        "comments": { // Comments
          type: 'object',
          description: 'Display name of the node',
          properties: {
            "type": {
              type: 'string',
              description: '"comments" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Comments'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Comments'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Enter "<comment> -- <name> <date>"'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "comments" value in tooltip on graph',
              default: true
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Hides "comments" from Node Editor, Nodes Table, and exports',
              default: false
            }
          }
        },
        "degrees": {
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
              default: 'Degrees'
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
              description: 'Hides "degrees" from Node Editor, Nodes Table, and exports',
              default: false
            }
          }
        },
        "created": { // Built-in data DO NOT MODIFY!
          type: 'object',
          description: 'System-generated date.  This setting used to show/hide tooltip in graph and import/export',
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
              description: 'Requires "created" for exports and imports',
              default: false
            }
          }
        },
        "updated": { // Built-in data DO NOT MODIFY!
          type: 'object',
          description: 'System-generated date.  This setting used to show/hide tooltip in graph and import/export',
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
              description: 'Requires "updated" for exports and imports',
              default: false
            }
          }
        },
        "revision": { // Built-in data DO NOT MODIFY!
          type: 'object',
          description: 'System-generated data.  This setting used to show/hide tooltip in graph and import/export',
          properties: {
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Revision'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Revision'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "revision" value in tooltip on graph',
              default: true
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Number of times this node has been revised'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Requires "revision" for exports and imports',
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
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              options: { hidden: true }, // not end-user editable, always hidden from Template Editor
              description: 'Not used.  "id" is always hidden.',
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
              format: 'checkbox',
              options: { hidden: true }, // not end-user editable, always hidden from Template Editor
              description: 'Not used.  "source" is always shown.',
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
              format: 'checkbox',
              options: { hidden: true }, // not end-user editable, always hidden from Template Editor
              description: 'Not used.  "target" is always shown.',
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
              description: 'Hides "type" from Edge Editor, Edges Table, and exports',
              default: false
            },
            "options": Object.assign({}, MOD.EDGETYPEOPTIONS, { description: 'NOTE: We recommend using the "Edit Edge Types" feature to edit Edge Types.  It provides additional dataset migration tools.' })
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
              description: 'Hides "notes" from Edge Editor, Edges Table, and exports',
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
              description: 'Hides "info" from Edge Editor, Edges Table, and exports',
              default: false
            }
          }
        },
        "provenance": { // Provenance/Source
          type: 'object',
          description: 'Display name of the edge',
          properties: {
            "type": {
              type: 'string',
              description: '"provenance" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Provenance'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Provenance'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Node Editor form',
              default: 'Who created this?  (aka Provenance)'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Hides "provenance" from Node Editor, Nodes Table, and exports',
              default: false
            }
          }
        },
        "comments": { // Comments
          type: 'object',
          description: 'Display name of the edge',
          properties: {
            "type": {
              type: 'string',
              description: '"comments" data type',
              default: 'string'
            },
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Comments'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Comments'
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Edge Editor form',
              default: 'Enter "<comment> -- <name> <date>"'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "comments" value in tooltip on graph',
              default: true
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Hides "comments" from Edge Editor, Edges Table, and exports',
              default: false
            }
          }
        },
        "citation": {
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
              description: 'Hides "citation" from Edge Editor, Edges Table, and exports',
              default: false
            }
          }
        },
        "category": {
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
              description: 'Hides "category" from Edge Editor, Edges Table, and exports',
              default: true
            }
          }
        },
        "created": { // Built-in data DO NOT MODIFY!
          type: 'object',
          description: 'System-generated date.  This setting used to show/hide tooltip in graph and import/export',
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
              description: 'Help text to display on the Edge Editor form',
              default: 'Date and time edge was created'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Requires "created" for exports and imports',
              default: false
            }
          }
        },
        "updated": { // Built-in data DO NOT MODIFY!
          type: 'object',
          description: 'System-generated date.  This setting used to show/hide tooltip in graph and import/export',
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
              description: 'Help text to display on the Edge Editor form',
              default: 'Date and time edge was last modified'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Requires "updated" for exports and imports',
              default: false
            }
          }
        },
        "revision": { // Built-in data DO NOT MODIFY!
          type: 'object',
          description: 'System-generated data.  This setting used to show/hide tooltip in graph and import/export',
          properties: {
            "displayLabel": {
              type: 'string',
              description: 'Label to use for system display',
              default: 'Revision'
            },
            "exportLabel": {
              type: 'string',
              description: 'Label to use for exported csv file field name',
              default: 'Revision'
            },
            "includeInGraphTooltip": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Show "revision" value in tooltip on graph',
              default: true
            },
            "help": {
              type: 'string',
              description: 'Help text to display on the Edge Editor form',
              default: 'Number of times this edge has been revised'
            },
            "hidden": {
              type: 'boolean',
              format: 'checkbox',
              description: 'Requires "revision" for exports and imports',
              default: true
            }
          }
        }
      }
    }
  }
}



/// SCHEMA METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Extra schema definition for the Type Editor UI

    This introduces a wrapper around the Node or Edge Type Schema to provide
    extra UI elements for managing Type changes that the normal Template
    editor does not have:
    * Adds a checkbox to mark a type for deletion
    * Adds a field to map a deleted type to another type

    Used by the "Edit Node Types" and "Edit Edge Types" buttons.
/*/
MOD.GetTypeEditorSchema = schemaTypeOptions => {
  const typeOptions = clone(schemaTypeOptions);
  try {
    typeOptions.options.disable_array_delete = true;
    typeOptions.items.properties.label.options = {
      // For some reason inputAttribute 'disabled' does not work here
      // so we use a className to mark the field
      // then in Template.onEditNodeTypes we set the
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ ParseTemplateSchema generates and resturns the default template json
    Use this to create a pristine defaul template json
/*/
MOD.ParseTemplateSchema = () => {

  function ParseProperty(prop) {
    if (prop.type === 'string') return prop.default;
    if (prop.type === 'number') return prop.default;
    if (prop.type === 'boolean') return prop.default;
  }

  function ParseProperties(properties, currJson) {
    Object.keys(properties).forEach(templatePropertyKey => {
      const prop = properties[templatePropertyKey];
      if (prop.properties) {
        currJson[templatePropertyKey] = ParseProperties(prop.properties, {});
      } else {
        currJson[templatePropertyKey] = ParseProperty(prop);
      }
    });
    return currJson;
  }

  let json = {};
  ParseProperties(MOD.TEMPLATE.properties, json);
  return json;
}

MOD.ParseTemplateSchema();


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
