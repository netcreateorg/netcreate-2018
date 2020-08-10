import FILTER from './FilterEnums';
import React from 'react';
const ReactStrap = require('reactstrap');
const { Form, FormGroup, Input, Label } = ReactStrap;

export default function StringFilter({ filter: { id, name, type, value }, onChangeHandler }) {

  console.log('StringFilter: id is', id);

  function HandleChangeLocal(e) {
    const filterType = document.getElementById(`filterType-${id}`).value;
    const filterValue = document.getElementById(`filterValue-${id}`).value;
    // Construct search string
    // let result = name;
    // result +=':' + filterType + ':' + filterValue;
    let result = { name, type: filterType, value: filterValue };
    onChangeHandler(result);
  }

  const OPERATORS = [
    { value: FILTER.STRING_OPERATORS.EMPTY, label: "--"},
    { value: FILTER.STRING_OPERATORS.CONTAINS, label: "contains"},
    { value: FILTER.STRING_OPERATORS.NOT_CONTAINS, label: "does not contain"},
  ]

  return (
    <Form inline className="filter-item" id={id}>
      <FormGroup>
        <Label size="sm" style={{width:`5em`,justifyContent:'flex-end'}}>{name}&nbsp;</Label>
        <Input id={`filterType-${id}`} type="select" value={type} onChange={HandleChangeLocal} bsSize="sm">
          {OPERATORS.map(op => <option value={op.value} key={`${id}${op.value}`} size="sm">{op.label}</option>)}
        </Input>
        <Input id={`filterValue-${id}`} type="text" value={value} onChange={HandleChangeLocal} bsSize="sm"/>
      </FormGroup>
    </Form>
  );
}
