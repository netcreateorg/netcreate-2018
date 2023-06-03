/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILTERSPANEL

  This is the base UI component that displays filters in the InfoPanel.

  FiltersPanel
  |-- FiltersGroup
      |-- StringFilter
      |-- NumberFilter
      |-- SelectFilter

  FiltersPanel reads data directly from FDATA.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import FILTER from './FilterEnums';
import FilterGroup from './FilterGroup';
import FocusFilter from './FocusFilter';
import React from 'react';
const ReactStrap = require('reactstrap');

const { Button, ButtonGroup, Input, Label, FormGroup } = ReactStrap;

const UNISYS = require('unisys/client');
var UDATA  = null;

/// CLASS /////////////////////////////////////////////////////////////////////
class FiltersPanel extends UNISYS.Component {
  constructor({ filterGroups, onFiltersChange, tableHeight }) {
    super();

    this.UpdateFilterDefs = this.UpdateFilterDefs.bind(this);
    this.OnClearBtnClick = this.OnClearBtnClick.bind(this);
    this.SelectFilterAction = this.SelectFilterAction.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    // Load Templates
    // The intial `OnAppStateChange("FDATA")` event when the template is
    // first loaded is called well before FiltersPanel is
    // even constructed.  So we need to explicitly load it here.
    const FDATA = UDATA.AppState("FDATA");
    this.state = {
      nodes: FDATA.nodes,
      edges: FDATA.edges,
      filterAction: FILTER.ACTION.HIGHLIGHT,
      filterActionHelp: FILTER.ACTION.HELP.HIGHLIGHT,
      focusSourceLabel: undefined,
      focusRange: undefined
    };
    UDATA.OnAppStateChange("FDATA", this.UpdateFilterDefs);
  } // constructor

  componentWillUnmount() {
    // console.error('TBD: gracefully unsubscribe!')
    UDATA.AppStateChangeOff("FDATA", this.UpdateFilterDefs);
  }

  UpdateFilterDefs(data) {
    this.setState(state => {
      return {
        nodes: data.nodes,
        edges: data.edges,
        filterAction: data.filterAction || state.filterAction,
        filterActionHelp: data.filterActionHelp || state.filterActionHelp,
        focusSourceLabel: data.focus && data.focus.sourceLabel ? `"${data.focus.sourceLabel}"` : "<nothing selected>",
        focusRange: data.focus && data.focus.range ? data.focus.range : undefined
      }
    });
  }

  OnClearBtnClick() {
    UDATA.LocalCall('FILTER_CLEAR');
  }

  SelectFilterAction(filterAction) {
    let filterActionHelp;
    if (filterAction === FILTER.ACTION.HIGHLIGHT) filterActionHelp = FILTER.ACTION.HELP.HIGHLIGHT;
    if (filterAction === FILTER.ACTION.FILTER) filterActionHelp = FILTER.ACTION.HELP.FILTER;
    if (filterAction === FILTER.ACTION.COLLAPSE) filterActionHelp = FILTER.ACTION.HELP.COLLAPSE;
    if (filterAction === FILTER.ACTION.FOCUS) filterActionHelp = FILTER.ACTION.HELP.FOCUS;
    this.setState({ filterAction, filterActionHelp });
    UDATA.LocalCall('FILTERS_UPDATE', { filterAction });
  }

  render() {
    const { filterAction, filterActionHelp, focusRange, focusSourceLabel } = this.state;
    const defs = [this.state.nodes, this.state.edges];

    let FilterControlPanel;
    if (filterAction === FILTER.ACTION.FOCUS) {
      FilterControlPanel = <FocusFilter
        filter={{ value: 0 }}
        focusSourceLabel={focusSourceLabel}
        focusRange={focusRange}
    />;
    } else {
      FilterControlPanel = defs.map(def => <FilterGroup
        key={def.label}
        group={def.group}
        label={def.label}
        filters={def.filters}
        filterAction={filterAction}
        transparency={def.transparency}
        onFiltersChange={this.OnFilterChange}
      />);
     }

    return (
      <div className="filterPanel"
        style={{
          overflow: 'hidden',
          margin: '6px 0', padding: '5px',
          display: 'flex', flexDirection: 'column',
          backgroundColor: '#EEE',
          zIndex: '2000'
        }}>
        <ButtonGroup>
          <Button
            onClick={() => this.SelectFilterAction(FILTER.ACTION.HIGHLIGHT)}
            active={filterAction === FILTER.ACTION.HIGHLIGHT}
            outline={filterAction === FILTER.ACTION.HIGHLIGHT}
            disabled={filterAction === FILTER.ACTION.HIGHLIGHT}
            style={{
              color: filterAction === FILTER.ACTION.HIGHLIGHT ? '#333' : '#fff',
              backgroundColor: filterAction === FILTER.ACTION.HIGHLIGHT ? 'transparent' : '#6c757d88'
            }}
          >{FILTER.ACTION.HIGHLIGHT}</Button>
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
            onClick={() => this.SelectFilterAction(FILTER.ACTION.COLLAPSE)}
            active={filterAction === FILTER.ACTION.COLLAPSE}
            outline={filterAction === FILTER.ACTION.COLLAPSE}
            disabled={filterAction === FILTER.ACTION.COLLAPSE}
            style={{
              color: filterAction === FILTER.ACTION.COLLAPSE ? '#333' : '#fff',
              backgroundColor: filterAction === FILTER.ACTION.COLLAPSE ? 'transparent' : '#6c757d88'
            }}
          >{FILTER.ACTION.COLLAPSE}</Button>
          <Button
            onClick={() => this.SelectFilterAction(FILTER.ACTION.FOCUS)}
            active={filterAction === FILTER.ACTION.FOCUS}
            outline={filterAction === FILTER.ACTION.FOCUS}
            disabled={filterAction === FILTER.ACTION.FOCUS}
            style={{
              color: filterAction === FILTER.ACTION.FOCUS ? '#333' : '#fff',
              backgroundColor: filterAction === FILTER.ACTION.FOCUS ? 'transparent' : '#6c757d88'
            }}
          >{FILTER.ACTION.FOCUS}</Button>
        </ButtonGroup>
        <Label className="small text-muted" style={{ padding: '0.5em 0 0 0.5em', marginBottom: '0' }}>
          {filterActionHelp}
        </Label>
        <div style={{
          display: 'flex', flexDirection: 'column', flexGrow: `1`,
          overflowY: 'scroll'
        }}>
          <div>
            {FilterControlPanel}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-evenly', padding: '5px' }}>
          <Button size="sm" onClick={this.OnClearBtnClick} >Clear Filters</Button>
        </div>
      </div>
    )
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Storybook export
// export default FiltersPanel;

// Brunch export
module.exports = FiltersPanel;
