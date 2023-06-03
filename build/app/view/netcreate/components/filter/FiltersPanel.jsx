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
import React from 'react';
import StringFilter from './StringFilter';
const ReactStrap = require('reactstrap');

const { Button, ButtonGroup, Input, Label } = ReactStrap;

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
      filterActionHelp: FILTER.ACTION.HELP.HIGHLIGHT
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
        filterActionHelp: data.filterActionHelp || state.filterActionHelp
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
    this.setState({ filterAction, filterActionHelp });
    UDATA.LocalCall('FILTERS_UPDATE', { filterAction });
  }

  render() {
    const { filterAction, filterActionHelp } = this.state;
    const defs = [this.state.nodes, this.state.edges];
    return (
      <div className="filterPanel"
        style={{
          overflow: 'auto',
          marginTop: '6px', padding: '5px',
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
          >Highlight</Button>
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
          >Collapse</Button>
        </ButtonGroup>
        <Label className="small text-muted" style={{ padding: '0.5em 0 0 0.5em', marginBottom: '0' }}>
          {filterActionHelp}
        </Label>
        <hr/>
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: `1`, justifyContent: 'space-evenly' }}>
          {defs.map(def => <FilterGroup
            key={def.label}
            group={def.group}
            label={def.label}
            filters={def.filters}
            filterAction={filterAction}
            transparency={def.transparency}
            onFiltersChange={this.OnFilterChange}
          />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-evenly', padding: '10px' }}>
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
