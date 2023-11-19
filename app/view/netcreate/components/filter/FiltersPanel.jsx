/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILTERSPANEL

  This is the base UI component that displays filters in the InfoPanel.

  FiltersPanel
  |-- FiltersGroup
      |-- StringFilter
      |-- NumberFilter
      |-- SelectFilter

  FiltersPanel reads data directly from FILTERDEFS.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const FILTER = require('./FilterEnums');
const FilterGroup = require('./FilterGroup');
const FocusFilter = require('./FocusFilter');
const React = require('react');
const ReactStrap = require('reactstrap');
const { Button, ButtonGroup, Input, Label, FormGroup } = ReactStrap;
const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UDATA = null;

/// CLASS DECLARATIONS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class FiltersPanel extends UNISYS.Component {
  constructor({ filterGroups, onFiltersChange, tableHeight }) {
    super();

    this.UpdateFilterDefs = this.UpdateFilterDefs.bind(this);
    this.UpdateFilteredNCData = this.UpdateFilteredNCData.bind(this);
    this.LookupFilterHelp = this.LookupFilterHelp.bind(this);
    this.OnClearBtnClick = this.OnClearBtnClick.bind(this);
    this.SelectFilterAction = this.SelectFilterAction.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    // Load Templates
    // The intial `OnAppStateChange("FILTERDEFS")` event when the template is
    // first loaded is called well before FiltersPanel is
    // even constructed.  So we need to explicitly load it here.
    const FILTERDEFS = UDATA.AppState('FILTERDEFS');
    this.state = {
      nodes: FILTERDEFS.nodes,
      edges: FILTERDEFS.edges,
      filterAction: FILTER.ACTION.FADE,
      focusSourceLabel: undefined,
      focusRange: undefined,
      statsSummary: ''
    };
    UDATA.OnAppStateChange('FILTERDEFS', this.UpdateFilterDefs);
    UDATA.OnAppStateChange('FILTEREDNCDATA', this.UpdateFilteredNCData);
  } // constructor

  componentDidMount() {
    // update filter stats on load
    const FILTEREDNCDATA = UDATA.AppState('FILTEREDNCDATA');
    this.UpdateFilteredNCData(FILTEREDNCDATA);
  }

  componentWillUnmount() {
    UDATA.AppStateChangeOff('FILTERDEFS', this.UpdateFilterDefs);
    UDATA.AppStateChangeOff('FILTEREDNCDATA', this.UpdateFilteredNCData);
  }

  UpdateFilterDefs(data) {
    this.setState(state => {
      return {
        nodes: data.nodes,
        edges: data.edges,
        filterAction: data.filterAction || state.filterAction,
        filterActionHelp: data.filterActionHelp || state.filterActionHelp,
        focusSourceLabel:
          data.focus && data.focus.sourceLabel
            ? `"${data.focus.sourceLabel}"`
            : '<nothing selected>',
        focusRange: data.focus && data.focus.range ? data.focus.range : undefined
      };
    });
  }

  UpdateFilteredNCData(data = { stats: {} }) {
    this.setState({ statsSummary: data.stats.statsSummary });
  }

  LookupFilterHelp(filterAction) {
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    if (filterAction === FILTER.ACTION.FADE) return TEMPLATE.filterFadeHelp;
    //if (filterAction === FILTER.ACTION.FILTER) return FILTER.ACTION.HELP.FILTER; // FIX: Remove this once we decide we don't want to support Filter/hide
    if (filterAction === FILTER.ACTION.REDUCE) return TEMPLATE.filterReduceHelp;
    if (filterAction === FILTER.ACTION.FOCUS) return TEMPLATE.filterFocusHelp;
    return 'Help not found';
  }

  OnClearBtnClick() {
    UDATA.LocalCall('FILTER_CLEAR');
  }

  SelectFilterAction(filterAction) {
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    this.setState({ filterAction });
    UDATA.LocalCall('FILTERS_UPDATE', { filterAction });
  }

  render() {
    const { filterAction, focusRange, focusSourceLabel, statsSummary } = this.state;
    const defs = [this.state.nodes, this.state.edges];

    // Can we assume TEMPLATE is already loaded by the time we render?
    const TEMPLATE = UDATA.AppState('TEMPLATE');

    const labelFade = TEMPLATE.filterFade;
    const labelReduce = TEMPLATE.filterReduce;
    const labelFocus = TEMPLATE.filterFocus;

    const filterActionHelp = this.LookupFilterHelp(filterAction);

    let FilterControlPanel;
    if (filterAction === FILTER.ACTION.FOCUS) {
      FilterControlPanel = (
        <FocusFilter
          filter={{ value: 0 }}
          focusSourceLabel={focusSourceLabel}
          focusRange={focusRange}
        />
      );
    } else {
      FilterControlPanel = defs.map(def => (
        <FilterGroup
          key={def.label}
          group={def.group}
          label={def.label}
          filters={def.filters}
          filterAction={filterAction}
          transparency={def.transparency}
          onFiltersChange={this.OnFilterChange}
        />
      ));
    }

    return (
      <div
        className="filterPanel"
        style={{
          overflow: 'hidden',
          margin: '6px 0',
          padding: '5px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#EEE',
          zIndex: '2000'
        }}
      >
        <ButtonGroup>
          <Button
            onClick={() => this.SelectFilterAction(FILTER.ACTION.FADE)}
            active={filterAction === FILTER.ACTION.FADE}
            outline={filterAction === FILTER.ACTION.FADE}
            disabled={filterAction === FILTER.ACTION.FADE}
            style={{
              color: filterAction === FILTER.ACTION.FADE ? '#333' : '#fff',
              backgroundColor:
                filterAction === FILTER.ACTION.FADE ? 'transparent' : '#6c757d88'
            }}
          >
            {labelFade}
          </Button>
          {/* Hide "Filter" panel.  We will probably remove this functionality.
          <Button
            onClick={() => this.SelectFilterAction(FILTER.ACTION.FILTER)}
            active={filterAction === FILTER.ACTION.FILTER}
            outline={filterAction === FILTER.ACTION.FILTER}
            disabled={filterAction === FILTER.ACTION.FILTER}
            style={{
              color: filterAction === FILTER.ACTION.FILTER ? '#333' : '#fff',
              backgroundColor: filterAction === FILTER.ACTION.FILTER ? 'transparent' : '#6c757d88'
            }}
          >Filter</Button> */}
          <Button
            onClick={() => this.SelectFilterAction(FILTER.ACTION.REDUCE)}
            active={filterAction === FILTER.ACTION.REDUCE}
            outline={filterAction === FILTER.ACTION.REDUCE}
            disabled={filterAction === FILTER.ACTION.REDUCE}
            style={{
              color: filterAction === FILTER.ACTION.REDUCE ? '#333' : '#fff',
              backgroundColor:
                filterAction === FILTER.ACTION.REDUCE ? 'transparent' : '#6c757d88'
            }}
          >
            {labelReduce}
          </Button>
          <Button
            onClick={() => this.SelectFilterAction(FILTER.ACTION.FOCUS)}
            active={filterAction === FILTER.ACTION.FOCUS}
            outline={filterAction === FILTER.ACTION.FOCUS}
            disabled={filterAction === FILTER.ACTION.FOCUS}
            style={{
              color: filterAction === FILTER.ACTION.FOCUS ? '#333' : '#fff',
              backgroundColor:
                filterAction === FILTER.ACTION.FOCUS ? 'transparent' : '#6c757d88'
            }}
          >
            {labelFocus}
          </Button>
        </ButtonGroup>
        <Label
          className="small text-muted"
          style={{ padding: '0.5em 0 0 0.5em', marginBottom: '0' }}
        >
          {filterActionHelp}
        </Label>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: `1`,
            overflowY: 'scroll'
          }}
        >
          <div>{FilterControlPanel}</div>
        </div>
        <div
          style={{ display: 'flex', justifyContent: 'space-evenly', padding: '5px' }}
        >
          <Button size="sm" onClick={this.OnClearBtnClick}>
            Clear Filters
          </Button>
        </div>
        <Label
          className="small text-muted"
          style={{
            fontStyle: 'italic',
            padding: '0.5em 0 0 0.5em',
            marginBottom: '0'
          }}
        >
          {statsSummary}
        </Label>
      </div>
    );
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = FiltersPanel;
