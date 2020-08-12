const FILTER = {};

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

module.exports = FILTER;
