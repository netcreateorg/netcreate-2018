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
      filterAction: FILTER.ACTION.HIGHLIGHT
    };
    UDATA.OnAppStateChange("FDATA", this.UpdateFilterDefs);
  } // constructor

  componentWillUnmount() {
    // console.error('TBD: gracefully unsubscribe!')
  }

  UpdateFilterDefs(data) {
    this.setState(data);
  }

  OnClearBtnClick() {
    UDATA.LocalCall('FILTER_CLEAR');
  }

  SelectFilterAction(filterAction) {
    this.setState({ filterAction });
    UDATA.LocalCall('FILTERS_UPDATE', { filterAction });
  }

  render() {
    const { filterAction } = this.state;
    const { tableHeight } = this.props;
    const defs = [this.state.nodes, this.state.edges];
    return (
      <div className="filterPanel"
        style={{
          overflow: 'auto', position: 'relative',
          display: 'flex', flexDirection: 'column',
          maxHeight: tableHeight
        }}>
        <ButtonGroup>
          <Button
            onClick={() => this.SelectFilterAction(FILTER.ACTION.HIGHLIGHT)}
            active={filterAction === FILTER.ACTION.HIGHLIGHT}
            outline={filterAction === FILTER.ACTION.HIGHLIGHT}
            disabled={filterAction === FILTER.ACTION.HIGHLIGHT}
          >Highlight</Button>
          <Button
            onClick={() => this.SelectFilterAction(FILTER.ACTION.FILTER)}
            active={filterAction === FILTER.ACTION.FILTER}
            outline={filterAction === FILTER.ACTION.FILTER}
            disabled={filterAction === FILTER.ACTION.FILTER}
          >Filter</Button>
        </ButtonGroup>
        <Label className="small text-muted" style={{ padding: '0.5em 0 0 0.5em', marginBottom: '0' }}>
          {filterAction === FILTER.ACTION.HIGHLIGHT
            ? 'Highlight nodes/edges that match criteria. (Fade others)'
            : 'Filter shows only nodes/edges that match criteria.  (Removes others)'
          }
        </Label>
        <div style={{ display: 'flex', flexGrow: `1`, justifyContent: 'space-evenly' }}>
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
          <Button size="sm" onClick={this.OnClearBtnClick}>Clear Filters</Button>
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
