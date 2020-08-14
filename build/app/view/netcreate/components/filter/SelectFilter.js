/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SELECTFILTER

  SelectFilter provides the UI for setting drop-down menu selection
  style filters typically used for "type" node and edge properties.

  The menu options are defined with the extra `options` property
  of the filter.

  Two Select operators are supported (These just use the string operators on
  the values set via the menu selectios):
  * contains
  * not contains

  Matches will SHOW the resulting node or edge.
  Any nodes/edges not matching will be hidden.

  The filter definition is passed in via props.

    props
      {
        group       // "nodes" or "edges"
        filter: {
          id,       // numeric id used for unique React key
          type,     // filter type, e.g "string" vs "number"
          key,      // node field key from the template
          keylabel, // human friendly display name for the key.  This can be customized in the template.
          operator, // the comparison function, e.g. 'contains' or '>'
          value     // the search value to be used for matching
          options   // array of select option strings, e.g. ['abc','def',..]
        },
        onChangeHandler // callback function for parent component
      }

  The `onChangeHandler` callback function is not currently used.  Instead,
  selection changes directly trigger a UDATA.LocalCall('FILTER_DEFINE',...).

  The `id` variable allows us to potentially support multiple search filters
  using the same key, e.g. we could have two 'Label' filters.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


import FILTER from './FilterEnums';
import React from 'react';
const ReactStrap = require('reactstrap');
const { Form, FormGroup, Input, Label } = ReactStrap;

const UNISYS = require('unisys/client');
var UDATA = null;

const OPERATORS = [
  { value: FILTER.OPERATORS.NO_OP, label: "--"},
  { value: FILTER.OPERATORS.STRING.CONTAINS, label: "contains"},
  { value: FILTER.OPERATORS.STRING.NOT_CONTAINS, label: "does not contain"},
]


/// CLASS /////////////////////////////////////////////////////////////////////
class SelectFilter extends React.Component {

  constructor({
    group,
    filter: {id, type, key, keylabel, operator, value, options},
    onChangeHandler
  }) {
    super();
    this.OnChangeOperator = this.OnChangeOperator.bind(this);
    this.OnChangeValue = this.OnChangeValue.bind(this);
    this.TriggerChangeHandler = this.TriggerChangeHandler.bind(this);

    this.state = {
      operator: FILTER.OPERATORS.NO_OP, // Used locally to define result
      value: '' // Used locally to define result
    };

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);
  }

  OnChangeOperator(e) {
    this.setState({
      operator: e.target.value
    }, this.TriggerChangeHandler);
  }

  OnChangeValue(e) {
    this.setState({
      value: e.target.value
    }, this.TriggerChangeHandler);
  }

  TriggerChangeHandler() {
    const { id, type, key, keylabel, options } = this.props.filter;
    const filter = {
      id,
      type,
      key,
      keylabel,
      operator: this.state.operator,
      value: this.state.value,
      options
    };
    UDATA.LocalCall('FILTER_DEFINE', {
      group: this.props.group,
      filter
    }); // set a SINGLE filter
  }

  componentDidMount() {
    // Autoselect the first item
    this.setState({
      value: this.props.filter.options[0]
    });
  }

  render() {
    const { id, key, keylabel, operator, value, options } = this.props.filter;
    return (
      <Form inline className="filter-item" key={id}>
        <FormGroup>
          <Label size="sm" className="small text-muted"
            style={{ fontSize: '0.75em', lineHeight: '1em', width: `6em`, justifyContent: 'flex-end' }}>
            {keylabel}&nbsp;
          </Label>
          <Input type="select" value={operator}
            onChange={this.OnChangeOperator} bsSize="sm">
            {OPERATORS.map(op =>
              <option value={op.value} key={`${id}${op.value}`} size="sm">{op.label}</option>
            )}
          </Input>
          <Input type="select" value={value}
            onChange={this.OnChangeValue} bsSize="sm">
            {options.map(op =>
              <option value={op} key={`${id}${op}`} size="sm">{op}</option>
            )}
          </Input>
        </FormGroup>
      </Form>
    );
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SelectFilter;
