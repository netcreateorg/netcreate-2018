import FILTER from './FilterEnums';
import FilterGroup from './FilterGroup';
import React from 'react';
import StringFilter from './StringFilter';
const ReactStrap = require('reactstrap');

const { Button, Input, Label } = ReactStrap;

const UNISYS = require('unisys/client');
var UDATA  = null;


// Storybook has problems with loading unisys without relative ref
// but even with relative ref, it can't load submodules
// const UNISYS = require('../../../../unisys/client');
// class FiltersPanel extends React.Component {


class FiltersPanel extends UNISYS.Component {
  constructor({ filterGroups, onFiltersChange, tableHeight }) {
    super();

    this.UpdateFilterDefs = this.UpdateFilterDefs.bind(this);
    this.OnFilterReset = this.OnFilterReset.bind(this);
    this.OnClearBtnClick = this.OnClearBtnClick.bind(this);

     /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);


console.error('######## fieldPanel Constructor')
    // Load Templates
    // The intial `OnAppStateChange("FILTERDEFS")` event when the template is
    // first loaded is called well before FiltersPanel is
    // even constructed.  So we need to explicitly load it here.
    let FDATA = UDATA.AppState("FDATA");
    console.error('####### FDATA', FDATA)
    this.state = FDATA;

    UDATA.OnAppStateChange("FDATA", this.UpdateFilterDefs);
    UDATA.HandleMessage("FILTER_RESET", this.OnFilterReset);
  } // constructor


  UpdateFilterDefs(data) {
    console.error('####fieldpanel got state change', data)
    this.setState(data, () => {
      console.error('fieldpanel updated state is', this.state);
    });
  }

  // Reset the form
  OnFilterReset() {
    console.error('RESETING')
    UDATA.SetAppState("FDATA", { defs: [{group: "node", filters:[]},{group: "edge", filters:[]}] });
  }

  OnClearBtnClick() {
    this.OnFilterReset();
    // UDATA.LocalCall('FILTER_CLEAR');
  }

  componentWillUnmount() {
    console.error('gracefully unsubscribe!')
  }

  render() {
    const { tableHeight } = this.props;
    const defs = [this.state.nodes, this.state.edges];
    return (
      <div className="filterPanel"
        style={{
          overflow: 'auto', position: 'relative',
          display: 'flex', flexDirection: 'column',
          maxHeight: tableHeight
        }}>
        <div style={{ display: 'flex', flexGrow: `1`, justifyContent: 'space-evenly' }}>
          {defs.map(def => <FilterGroup
            key={def.label}
            group={def.group}
            label={def.label}
            filters={def.filters}
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

module.exports = FiltersPanel;

// storyboard wants a regular export?!?!
// export default FiltersPanel;
