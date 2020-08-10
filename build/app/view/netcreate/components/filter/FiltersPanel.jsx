import FilterGroup from './FilterGroup';
import React from 'react';
import StringFilter from './StringFilter';
const ReactStrap = require('reactstrap');

const { Input, Label } = ReactStrap;

const UNISYS = require('unisys/client');
var UDATA  = null;

// Storybook has problems with loading unisys without relative ref
// but even with relative ref, it can't load submodules
// const UNISYS = require('../../../../unisys/client');
// class FiltersPanel extends React.Component {

// Dummy Data
const filterData = {
  id: '1',
  name: 'Label',
  type: 'contains',
  value: 'tacitus'
};

class FiltersPanel extends UNISYS.Component {
  constructor({ filterGroups, onFiltersChange, tableHeight }) {
    super();

    console.log('filters is', filterGroups)

    this.OnFilterChange = this.OnFilterChange.bind(this);

     /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);
  } // constructor

  OnFilterChange (filter) {
    console.log('onFilterChange', filter);
    UDATA.LocalCall('FILTER', filter);
  OnClearBtnClick() {
    UDATA.LocalCall('FILTER', {action: 'clear'});
  }

  render() {
    const { tableHeight } = this.props;
    return (
      <div className="filterPanel"
            style={{overflow:'auto',position:'relative',display:'block',left:'10px',right:'10px',maxHeight:tableHeight}}>
        <StringFilter filter={filterData} onChangeHandler={this.OnFilterChange} />
        <Button size="sm" onClick={this.OnClearBtnClick}>Clear Filters</Button>
      </div>
    )
  }
}

module.exports = FiltersPanel;

// storyboard wants a regular export?!?!
// export default FiltersPanel;
