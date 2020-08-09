import React from 'react';
const ReactStrap = require('reactstrap');
const { Input, Label } = ReactStrap;

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

  const options = [
    { value: "empty", label: "--"},
    { value: "contains", label: "contains"},
    { value: "not-contains", label: "does not contain"},
  ]

  return (
    <div className="filter-item" id={id}>
      <Label>{name}:&nbsp;
        <Input id={`filterType-${id}`} type="select" value={type} onChange={HandleChangeLocal}>
          {options.map(option => <option value={option.value} key={`${id}${option.value}`}>{option.label}</option>)}
        </Input>
        <Input id={`filterValue-${id}`} type="text" value={value} onChange={HandleChangeLocal}/>
      </Label>
    </div>
  );
}
