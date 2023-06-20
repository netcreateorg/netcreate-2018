import React from 'react';
import StringFilter from './StringFilter';
import { action } from '@storybook/addon-actions';

export default {
  component: StringFilter,
  title: 'StringFilter',
  // Our exports that end in "Data" are not stories.
  excludeStories: /.*Data$/,
};

export const filterData = {
  id: '1',
  type: 'string',
  key: 'label',
  keylabel: 'Label',
  operator: 'contains',
  value: 'tacitus'
};

export const actionsData = {
  onChangeHandler: action('filterChanged') // onChangeHandler: this key needs match the key passed to StringFilter
                                           // action('filterChanged') is just a redux action label
};

// commented out for now, results in "unexpected token error" by brunch
export const Default = () => <StringFilter filter={{ ...filterData }} {...actionsData} />;
// export const NoValue = () => <StringFilter filter={{ id: filterData.id, name: filterData.name }} {...actionsData} />;
// export const Changed = () => <StringFilter filter={{ ...filterData, state: 'CHANGED' }} {...actionsData} />;

// export const Archived = () => (
//   <StringFilter task={{ ...taskData, state: 'TASK_ARCHIVED' }} {...actionsData} />
// );
