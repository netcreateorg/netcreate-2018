import FILTER from './FilterEnums';
import NumberFilter from './NumberFilter';
import React from 'react';
import SelectFilter from './SelectFilter';
import StringFilter from './StringFilter';
const ReactStrap = require('reactstrap');
const { Input, Label } = ReactStrap;

export default function FilterGroup({
  group, label, filters
}) {
  return (
    <div className="filter-group" style={{margin:'5px 5px 5px 0',padding:'10px',backgroundColor:'rgba(0,0,0,0)'}}>
      <div className="small text-muted" style={{fontWeight:'bold',textTransform:'uppercase',marginBottom:'0.4em'}}>{label}</div>
      {filters.map(filterData => {
        switch (filterData.type) {
          case FILTER.TYPES.STRING:
          case FILTER.TYPES.NODE:
            return <StringFilter key={filterData.id} group={group} filter={filterData} />
            break;
          case FILTER.TYPES.NUMBER:
            return <NumberFilter key={filterData.id} group={group} filter={filterData} />
            break;
          case FILTER.TYPES.SELECT:
            return <SelectFilter key={filterData.id} group={group} filter={filterData} />
            break;
          default:
            console.error(`FilterGroup: Filter Type not found ${filterData.type}`)
            break;
        }
      })}
    </div>
  );
}
