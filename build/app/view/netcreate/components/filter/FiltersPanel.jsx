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


// Playing with alternative representation:
// PROS
// * More concise
// CONS
// * Restricts ability to create two filters on the same key
const FILTERDEF = {
  nodes: {
    label: "Nodes",
    filters: {
      label: {
        keylabel: 'Label',
        operator: 'contains',
        value: 'tacitus'
      },
      type: {
        keylabel: 'Type',
        operator: 'not-contains',
        value: 'person'
      },
      notes: {
        keylabel: 'Significance',
        operator: 'contains',
        value: 'xxx'
      }
    }
  },
  edges: {
    label: "Edges",
    filters: {}
  }
}



// eventually generate this from template?
let filterDefs = [
  {
    group: "node",
    label: "Nodes -- Show me all nodes where...",
    filters: [
      {
        id: '1',
        key: 'label',
        keylabel: 'Label',
        operator: 'no-op',
        value: ''
      },
      {
        id: '4',
        key: 'label',
        keylabel: 'Label',
        operator: 'no-op',
        value: ''
      },
      {
        id: '2',
        key: 'type',
        keylabel: 'Type',
        operator: 'no-op',
        value: ''
      },
      {
        id: '3',
        key: 'notes',
        keylabel: 'Significance',
        operator: 'no-op',
        value: ''
      }
    ]
  },
  {
    group: "edge",
    label: "Edges",
    filters: [
      {
        id: '5',
        key: 'source',
        keylabel: 'Source',
        operator: 'no-op',
        value: ''
      },
      {
        id: '6',
        key: 'type',
        keylabel: 'Type',
        operator: 'no-op',
        value: ''
      },
      {
        id: '7',
        key: 'target',
        keylabel: 'Target',
        operator: 'no-op',
        value: ''
      }
    ]
  }
];


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
    let FDATA = UDATA.AppState("FILTERDEFS");
    console.error('####### FDATA', FDATA)
    this.state = { defs: FDATA.defs };

// defs should be triggered by filter-logic
// but constructor doesn't init until fairly late.
    // // HACK in filter set here for now
    // // Eventually this should be read from the template file
    // UDATA.SetAppState("FILTERDEFS", { defs: filterDefs });

    UDATA.OnAppStateChange("FILTERDEFS", this.UpdateFilterDefs);

    UDATA.HandleMessage("FILTER_RESET", this.OnFilterReset);

  } // constructor


  UpdateFilterDefs(data) {
    console.error('####fieldpanel got state change', data)
    this.setState({ defs: data.defs }, () => {
      console.error('fieldpanel updated state is', this.state.defs);
    });
  }

  // Reset the form
  OnFilterReset() {
    console.error('RESETING')
    UDATA.SetAppState("FILTERDEFS", { defs: [{group: "node", filters:[]},{group: "edge", filters:[]}] });
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
    const { defs } = this.state;
    return (
      <div className="filterPanel"
        style={{
          overflow: 'auto', position: 'relative',
          display: 'flex', flexDirection: 'column',
          maxHeight: tableHeight,
          backgroundColor:'rgba(0,0,0,0.1)'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
          {defs.map(def => <FilterGroup
            key={def.label}
            group={def.group}
            label={def.label}
            filters={def.filters}
            onFiltersChange={this.OnFilterChange}
          />)}
        </div>
        <Button size="sm" onClick={this.OnClearBtnClick}>Clear Filters</Button>
      </div>
    )
  }
}

module.exports = FiltersPanel;

// storyboard wants a regular export?!?!
// export default FiltersPanel;
