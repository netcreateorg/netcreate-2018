/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  All declare modules are dependency-free so can be imported by anyone

  There is no formal declaration of what is in a node or edge in NC-2018.
  This is our code reference that will be used for runtime validation.

  PLACEHOLDER WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NC_Object {
  id = 0; // unique number
  info = ''; // string
  provenance = ''; // string
  notes = ''; // string
  comments = ''; // string
  // not manipulable by users
  #created = ''; // string
  #updated = ''; //string
  #revision = ''; //string
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NC_Node extends NC_Object {
  label = 'label'; // string
  type = 'nodeType'; // string (node type)
  degrees = 0; // number (bug? declared as string in NC)
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NC_Edge extends NC_Object {
  source = 0; // NC_Node id (bug? declared as string in NC)
  target = 0; // NC_Node id (bug? declared as string in NC)
  type = 'edgeType'; // string (edge type)
  citation = ''; // string
  weight = 1; // number
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NC_Graph {
  nodes = [];
  edges = [];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NC_Project {}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  NC_Object,
  NC_Node,
  NC_Edge,
  NC_Graph,
  NC_Project
};
