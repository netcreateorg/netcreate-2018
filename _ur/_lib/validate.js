/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  description'

let node = {
  label : formData.label?formData.label:'',
  id: formData.id,
  type: formData.type,
  info: formData.info,
  provenance: formData.provenance,
  comments: formData.comments,
  notes: formData.notes,
  degrees: formData.degrees
};

id is number
label is string
type is string
notes is string
info is string
provenance is string
comments is string
degrees is string this might be a bug
created is string (metadata)
updated is string (metadata)
revision is string (metadata)

id is number
source is string (bug? is this referring to a node label or an id???)
target is string (bug? is this referring to a node label or id???)
type is string
notes is string
info is string
weight is number
provenance is string
comments is string
citation is string


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { object, number, string, array, optional } = require('superstruct');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const NC_NODE = object({});
const NCDATA = object({
  nodes: array(NCNODE),
  edges: array(NCEDGE)
});

/// METHODS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ValidateNCData(data) {}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {};
