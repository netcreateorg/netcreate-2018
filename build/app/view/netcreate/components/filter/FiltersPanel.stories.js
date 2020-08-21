import FiltersPanel from './FiltersPanel';
import React from 'react';
import { action } from '@storybook/addon-actions';


export default {
  component: FiltersPanel,
  title: 'FiltersPanel',
  // Our exports that end in "Data" are not stories.
  excludeStories: /.*Data$/,
};

export const fdata = {
  nodes: {
    group: "nodes",
    label: "Nodes",
    filters: [
      {
        id: '1',
        type: 'string',
        key: 'label',
        keylabel: 'Label',
        operator: 'contains',
        value: 'tacitus'
      },
      {
        id: '2',
        type: 'select',
        key: 'type',
        keylabel: 'Type',
        operator: 'contains',
        value: 'person',
        options: [
          'abc', 'def', 'ghi'
        ]
      },
      {
        id: '3',
        type: 'number',
        key: 'notes',
        keylabel: 'Significance',
        operator: 'contains',
        value: 'xxx'
      }
    ]
  },
  edges: {
    group: "edges",
    label: "Edges",
    filters: [
      {
        id: '1',
        type: 'string',
        key: 'label',
        keylabel: 'Label',
        operator: 'contains',
        value: 'tacitus'
      },
      {
        id: '2',
        type: 'select',
        key: 'type',
        keylabel: 'Type',
        operator: 'contains',
        value: 'person',
        options: [
          'abc', 'def', 'ghi'
        ]
      },
      {
        id: '3',
        type: 'number',
        key: 'notes',
        keylabel: 'Significance',
        operator: 'contains',
        value: 'xxx'
      }

    ]
  }
}

export const actionsData = {
  onFiltersChange: action('filtersChanged')
};

export const Default = () => <FiltersPanel filterGroups={fdata} {...actionsData} />;
// export const NoValue = () => <FilterGroup filter={{ id: filterData.id, name: filterData.name }} {...actionsData} />;
// export const Changed = () => <FilterGroup filter={{ ...filterData, state: 'CHANGED' }} {...actionsData} />;

