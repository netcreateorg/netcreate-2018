/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Filter UDATA Messages

  Affects ALL Filters
  ===================

    FILTERDEFS      AppState
                    Sets the FILTERDEFS data object
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

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FILTER = {};
// Filter Panel Label
FILTER.PANEL_LABEL = 'VIEWS';
// Determines whether filter action is to highlight/fade or remove (filter) nodes and edges
// These labels are used as default values if an older version template has not defined them
FILTER.ACTION = {};
FILTER.ACTION.FADE = 'FADE';
FILTER.ACTION.FILTER = 'FILTERING'; // FIX: Remove this after we decide to remove FILTER/HIDE
FILTER.ACTION.REDUCE = 'REMOVE';
FILTER.ACTION.FOCUS = 'FOCUS';
// Types of filters definable in template files.
FILTER.TYPES = {};
FILTER.TYPES.STRING = 'string';
FILTER.TYPES.NUMBER = 'number';
FILTER.TYPES.SELECT = 'select';
FILTER.TYPES.NODE = 'node'; // edge source / target
FILTER.TYPES.DATE = 'date';
FILTER.TYPES.MARKDOWN = 'markdown';
FILTER.TYPES.HIDDEN = 'hidden';
// Special Edge Keys mapped to node objects
// Used by m_IsEdgeMatchedByFilter to find node labels
FILTER.KEY = {};
FILTER.KEY.SOURCE = 'source';
FILTER.KEY.TARGET = 'target';
// key needs to match the OPERATOR name for lookup purposes
// in filter-mgr.js
FILTER.OPERATORS = {};
FILTER.OPERATORS.NO_OP = { key: 'NO_OP', label: '--' };
FILTER.OPERATORS.CONTAINS = { key: 'CONTAINS', label: 'contains' };
FILTER.OPERATORS.NOT_CONTAINS = { key: 'NOT_CONTAINS', label: 'does not contain' };
FILTER.OPERATORS.IS_EMPTY = { key: 'IS_EMPTY', label: 'is empty' };
FILTER.OPERATORS.IS_NOT_EMPTY = { key: 'IS_NOT_EMPTY', label: 'is not empty' };
FILTER.OPERATORS.GT = { key: 'GT', label: '>' };
FILTER.OPERATORS.GT_EQ = { key: 'GT_EQ', label: '>=' };
FILTER.OPERATORS.LT = { key: 'LT', label: '<' };
FILTER.OPERATORS.LT_EQ = { key: 'LT_EQ', label: '<=' };
FILTER.OPERATORS.EQ = { key: 'EQ', label: '=' };
FILTER.OPERATORS.NOT_EQ = { key: 'NOT_EQ', label: `\u2260` };

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = FILTER;
