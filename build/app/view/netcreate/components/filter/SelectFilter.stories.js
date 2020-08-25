import React from 'react';
import SelectFilter from './SelectFilter';
import { action } from '@storybook/addon-actions';
import FILTER from './FilterEnums';

export default {
  component: SelectFilter,
  title: 'SelectFilter',
  // Our exports that end in "Data" are not stories.
  excludeStories: /.*Data$/,
};

export const filterData = {
  id: '1',
  type: 'number',
  key: 'degrees',
  keylabel: 'Degrees',
  operator: FILTER.OPERATORS.NUMBER.GT,
  value: 2,
  options: [
    "Person","Group","Place","Thing","Event"
  ]
};

export const actionsData = {
  onChangeHandler: action('filterChanged') // onChangeHandler: this key needs match the key passed to SelectFilter
                                           // action('filterChanged') is just a redux action label
};

export const Default = () => <SelectFilter filter={{ ...filterData }} {...actionsData} />;
