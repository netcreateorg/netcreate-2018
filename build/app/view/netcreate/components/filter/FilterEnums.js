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

FILTER.STRING_OPERATORS = {};
FILTER.STRING_OPERATORS.NO_OP = "no-op";
FILTER.STRING_OPERATORS.CONTAINS = "contains";
FILTER.STRING_OPERATORS.NOT_CONTAINS = "not-contains";

FILTER.SELECT_OPERATORS = {};
FILTER.SELECT_OPERATORS.CONTAINS = "contains";
FILTER.SELECT_OPERATORS.NOT_CONTAINS = "not-contains";

FILTER.NUMBER_OPERATORS = {};
FILTER.NUMBER_OPERATORS.GT = "gt";
FILTER.NUMBER_OPERATORS.GT_EQ = "gt_eq";
FILTER.NUMBER_OPERATORS.LT = "lt";
FILTER.NUMBER_OPERATORS.LT_EQ = "lt-eq";
FILTER.NUMBER_OPERATORS.EQ = "eq";
FILTER.NUMBER_OPERATORS.NOT_EQ = "not-eq";

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
