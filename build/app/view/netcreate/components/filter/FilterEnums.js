const FILTER = {};

// Types of filters definable in template files.
FILTER.TYPES = {};
FILTER.TYPES.STRING = 'string';
FILTER.TYPES.NUMBER = 'number';
FILTER.TYPES.SELECT = 'select';
FILTER.TYPES.NODE   = 'node'; // edge source / target
FILTER.TYPES.DATE   = 'date';
FILTER.TYPES.HIDDEN = 'hidden';

// Special Edge Keys mapped to node objects
// Used by m_IsEdgeMatchedByFilter to find node labels
FILTER.KEY = {};
FILTER.KEY.SOURCE = "source";
FILTER.KEY.TARGET = "target";


FILTER.OPERATORS = {};

// key needs to match the OPERATOR name for lookup purposes
// in filter-logic.js
FILTER.OPERATORS.NO_OP = { key: "NO_OP", label: "--" };
FILTER.OPERATORS.CONTAINS = { key: "CONTAINS", label: "contains" };
FILTER.OPERATORS.NOT_CONTAINS = { key: "NOT_CONTAINS", label: "does not contain" };
FILTER.OPERATORS.GT = { key: "GT", label: ">" };
FILTER.OPERATORS.GT_EQ = { key: "GT_EQ", label: ">=" };
FILTER.OPERATORS.LT = { key: "LT", label: "<" };
FILTER.OPERATORS.LT_EQ = { key: "LT_EQ", label: "<=" };
FILTER.OPERATORS.EQ = { key: "EQ", label: "=" };
FILTER.OPERATORS.NOT_EQ = { key: "NOT_EQ", label: `\u2260` };


/*/ UDATA MESSAGES ////////////////////////////////////////////////////////////

Filter UDATA Messages


Affects ALL Filters
===================

  FDATA           AppState
                  Sets the FDATA data object
                  Triggers AppStateChange

  FILTER_CLEAR    Message / LocalCall
                  Unhides all objects on the graph
                  Resets filter form to blank state

  FILTER_SUMMARY_UPDATE
                  Message / LocalCall
                  Summary of filters for InfoPanel display
                  is updated.


Affects Individual Filters
==========================

  FILTER_DEFINE   Define a single new filter


/*/

module.exports = FILTER;
