import FILTER from './FilterEnums';
import FilterGroupProperties from './FilterGroupProperties';
import NumberFilter from './NumberFilter';
import React from 'react';
import SelectFilter from './SelectFilter';
import StringFilter from './StringFilter';
const ReactStrap = require('reactstrap');
const { Input, Label } = ReactStrap;

export default function FilterGroup({
  group,
  label,
  filters,
  filterAction,
  transparency
}) {
  return (
    <div
      className="filter-group"
      style={{
        margin: '5px 5px 5px 0',
        padding: '10px',
        backgroundColor: 'rgba(0,0,0,0)'
      }}
    >
      <div
        className="small text-muted"
        style={{
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginBottom: '0.4em'
        }}
      >
        {label}
      </div>
      {filters.map(filter => {
        switch (filter.type) {
          case FILTER.TYPES.STRING:
          case FILTER.TYPES.NODE:
            return (
              <StringFilter
                key={filter.id}
                group={group}
                filter={filter}
                filterAction={filterAction}
              />
            );
          case FILTER.TYPES.NUMBER:
            return (
              <NumberFilter
                key={filter.id}
                group={group}
                filter={filter}
                filterAction={filterAction}
              />
            );
          case FILTER.TYPES.SELECT:
            return (
              <SelectFilter
                key={filter.id}
                group={group}
                filter={filter}
                filterAction={filterAction}
              />
            );
          default:
            console.error(
              `FilterGroup: Filter Type not found ${filter.type} for filter`,
              filter
            );
            break;
        }
        return '';
      })}
      <FilterGroupProperties group={group} transparency={transparency} />
      <hr />
    </div>
  );
}
