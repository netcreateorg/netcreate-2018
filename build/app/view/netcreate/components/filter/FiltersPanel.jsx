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

const { Button, Input, Label } = ReactStrap;

const UNISYS = require('unisys/client');
var UDATA  = null;

/// CLASS /////////////////////////////////////////////////////////////////////
class FiltersPanel extends UNISYS.Component {
  constructor({ filterGroups, onFiltersChange, tableHeight }) {
    super();

    this.UpdateFilterDefs = this.UpdateFilterDefs.bind(this);
    this.OnClearBtnClick = this.OnClearBtnClick.bind(this);

     /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    // Load Templates
    // The intial `OnAppStateChange("FDATA")` event when the template is
    // first loaded is called well before FiltersPanel is
    // even constructed.  So we need to explicitly load it here.
    let FDATA = UDATA.AppState("FDATA");
    this.state = FDATA;

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

  }

  render() {
    const { tableHeight, filterAction } = this.props;
    const defs = [this.state.nodes, this.state.edges];
    return (
      <div className="filterPanel"
        style={{
          overflow: 'auto', position: 'relative',
          display: 'flex', flexDirection: 'column',
          maxHeight: tableHeight
        }}>
        <Label className="small text-muted" style={{ padding: '0.5em 0 0 0.5em', marginBottom: '0' }}>
          {filterAction === FILTER.ACTION.HIGHLIGHT
            ? 'Highlight nodes/edges that match criteria. (Fade others)'
            : 'Remove nodes/edges that match criteria.'
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
