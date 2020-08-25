import React from 'react';
import NumberFilter from './NumberFilter';
import { action } from '@storybook/addon-actions';
import FILTER from './FilterEnums';

export default {
  component: NumberFilter,
  title: 'NumberFilter',
  // Our exports that end in "Data" are not stories.
  excludeStories: /.*Data$/,
};

export const filterData = {
  id: '1',
  type: 'number',
  key: 'degrees',
  keylabel: 'Degrees',
  operator: FILTER.OPERATORS.NUMBER.GT,
  value: 2
};

export const actionsData = {
  onChangeHandler: action('filterChanged') // onChangeHandler: this key needs match the key passed to NumberFilter
                                           // action('filterChanged') is just a redux action label
};

export const Default = () => <NumberFilter filter={{ ...filterData }} {...actionsData} />;
