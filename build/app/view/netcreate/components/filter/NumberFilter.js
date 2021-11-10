/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NUMBERFILTER

  NumberFilter provides the UI for entering search strings for numeric-based
  node and edge properties.

  Seven Numeric  operators are supported:
  * >
  * >=
  * <
  * <=
  * =
  * !=

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
  FILTER.OPERATORS.NO_OP,
  FILTER.OPERATORS.GT,
  FILTER.OPERATORS.GT_EQ,
  FILTER.OPERATORS.LT,
  FILTER.OPERATORS.LT_EQ,
  FILTER.OPERATORS.EQ,
  FILTER.OPERATORS.NOT_EQ
];


/// CLASS /////////////////////////////////////////////////////////////////////
class NumberFilter extends React.Component {

  constructor({
    group,
    filter: {id, type, key, keylabel, operator, value},
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
    const { filterAction } = this.props;
    const { id, type, key, keylabel } = this.props.filter;
    const filter = {
      id,
      type,
      key,
      keylabel,
      operator: this.state.operator,
      value: this.state.value
    };
    UDATA.LocalCall('FILTER_DEFINE', {
      group: this.props.group,
      filter,
      filterAction
    }); // set a SINGLE filter
  }

  render() {
    const { filterAction } = this.props;
    const { id, key, keylabel, operator, value } = this.props.filter;
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
              <option value={op.key} key={`${id}${op.key}`} size="sm">{op.label}</option>
            )}
          </Input>
          <Input type="text" value={value} placeholder="..."
            onChange={this.OnChangeValue} bsSize="sm" />
        </FormGroup>
      </Form>
    );
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NumberFilter;
