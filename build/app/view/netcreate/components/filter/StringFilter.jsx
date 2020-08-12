import FILTER from './FilterEnums';
import React from 'react';
const ReactStrap = require('reactstrap');
const { Form, FormGroup, Input, Label } = ReactStrap;

export default function StringFilter({
  filter: {
    id,
    key,
    keylabel, // human friendly display name for the key.  This can be customized in the template.
    operator,
    value
  },
  onChangeHandler
}) {

  const OPERATORS = [
    { value: FILTER.STRING_OPERATORS.CONTAINS, label: "contains"},
    { value: FILTER.STRING_OPERATORS.NOT_CONTAINS, label: "does not contain"},
  ]

  console.log('StringFilter: id is', id);

  function HandleChangeLocal(e) {
    const filterType = document.getElementById(`filterType-${id}`).value;
    const filterValue = document.getElementById(`filterValue-${id}`).value;
    // Construct search string
    // let result = name;
    // result +=':' + filterType + ':' + filterValue;
    let result = { key, operator: filterType, value: filterValue };
    onChangeHandler(result);
  { value: FILTER.STRING_OPERATORS.NO_OP, label: "--"},
  }

  return (
    <Form inline className="filter-item" id={id}>
      <FormGroup>
        <Label size="sm" style={{width:`5em`,justifyContent:'flex-end'}}>{keylabel}&nbsp;</Label>
        <Input id={`filterType-${id}`} type="select" value={operator} onChange={HandleChangeLocal} bsSize="sm">
          {OPERATORS.map(op =>
            <option value={op.value} key={`${id}${op.value}`} size="sm">{op.label}</option>
          )}
        </Input>
        <Input id={`filterValue-${id}`} type="text" value={value} onChange={HandleChangeLocal} bsSize="sm"/>
      </FormGroup>
    </Form>
  );
}
