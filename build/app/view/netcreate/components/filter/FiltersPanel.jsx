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

// Dummy Data
// const filterData = {
//   id: '1',
//   name: 'Label',
//   type: 'contains',
//   value: 'tacitus'
// };
const filtersDefs = [
  {
    label: "Nodes",
    filters: [
      {
        id: '1',
        key: 'label',
        keylabel: 'Label',
        operator: 'contains',
        value: 'tacitus'
      },
      {
        id: '2',
        key: 'type',
        keylabel: 'Type',
        operator: 'contains',
        value: 'person'
      },
      {
        id: '3',
        key: 'notes',
        keylabel: 'Significance',
        operator: 'contains',
        value: 'xxx'
      }
    ]
  },
  {
    label: "Edges",
    filters: [
      {
        id: '1',
        key: 'source',
        keylabel: 'Source',
        operator: 'contains',
        value: 'tacitus'
      },
      {
        id: '2',
        key: 'type',
        keylabel: 'Type',
        operator: 'not-contains',
        value: 'is related to'
      },
      {
        id: '3',
        key: 'target',
        keylabel: 'Target',
        operator: 'contains',
        value: 'Rome'
      }
    ]
  }
];


class FiltersPanel extends UNISYS.Component {
  constructor({ filterGroups, onFiltersChange, tableHeight }) {
    super();

    console.log('filters is', filterGroups)

    this.OnFilterChange = this.OnFilterChange.bind(this);
    this.OnClearBtnClick = this.OnClearBtnClick.bind(this);

     /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);
  } // constructor

  OnFilterChange(filter) {
    console.log('onFilterChange', filter);
    UDATA.LocalCall('FILTER', { action: FILTER.ACTIONS.FILTER_NODES , filter });
  }

  OnClearBtnClick() {
    UDATA.LocalCall('FILTER', {action: FILTER.ACTIONS.CLEAR });
  }

  render() {
    const { tableHeight } = this.props;
    return (
      <div className="filterPanel"
        style={{
          overflow: 'auto', position: 'relative', display: 'block',
          maxHeight: tableHeight,
          backgroundColor:'rgba(0,0,0,0.1)'
        }}>
        <div style={{ display: 'flex' }}>
          {filtersDefs.map(def => <FilterGroup
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
