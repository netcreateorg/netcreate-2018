const FILTER = {};

FILTER.TYPES = {};
FILTER.TYPES.STRING = 'string';
FILTER.TYPES.NUMBER = 'number';
FILTER.TYPES.SELECT = 'select';
FILTER.TYPES.HIDDEN = 'hidden';
FILTER.TYPES.NODE = 'node'; // edge source / target


// Special Edge Keys mapped to node objects
// Used by m_IsEdgeMatchedByFilter to find node labels
FILTER.KEY = {};
FILTER.KEY.SOURCE = "source";
FILTER.KEY.TARGET = "target";

FILTER.ACTIONS = {};
FILTER.ACTIONS.CLEAR = "clear";
FILTER.ACTIONS.FILTER_NODES = "filter-nodes";
FILTER.ACTIONS.FILTER_EDGES = "filter-edges";

FILTER.OPERATORS = {};
FILTER.OPERATORS.NO_OP = "no-op";

FILTER.OPERATORS.STRING = {};
FILTER.OPERATORS.STRING.CONTAINS = "contains";
FILTER.OPERATORS.STRING.NOT_CONTAINS = "not-contains";

FILTER.OPERATORS.SELECT = {};
FILTER.OPERATORS.SELECT.CONTAINS = "contains";
FILTER.OPERATORS.SELECT.NOT_CONTAINS = "not-contains";

FILTER.OPERATORS.NUMBER = {};
FILTER.OPERATORS.NUMBER.GT = "gt";
FILTER.OPERATORS.NUMBER.GT_EQ = "gt_eq";
FILTER.OPERATORS.NUMBER.LT = "lt";
FILTER.OPERATORS.NUMBER.LT_EQ = "lt-eq";
FILTER.OPERATORS.NUMBER.EQ = "eq";
FILTER.OPERATORS.NUMBER.NOT_EQ = "not-eq";

/*/

Filter UDATA Messages

All Filters operations

  FILTERDEFS      Set the FILTERDEFS data object
                  FILTERDATA?  FILTER_DATA?
                  FDATA? FLTRDATA

  FILTER_RESET    Resets filter form to blank state

Individual Filter Operations

  FILTER_DEFINE   Define a new individual filter


/*/



module.exports = FILTER;
