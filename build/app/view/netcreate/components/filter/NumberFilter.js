import FILTER from './FilterEnums';
import React from 'react';
const ReactStrap = require('reactstrap');
const { Form, FormGroup, Input, Label } = ReactStrap;

const UNISYS = require('unisys/client');
var UDATA = null;

const OPERATORS = [
  { value: FILTER.OPERATORS.NUMBER.NO_OP, label: "--"},
  { value: FILTER.OPERATORS.NUMBER.GT, label: ">"},
  { value: FILTER.OPERATORS.NUMBER.GT_EQ, label: ">="},
  { value: FILTER.OPERATORS.NUMBER.LT, label: "<"},
  { value: FILTER.OPERATORS.NUMBER.LT_EQ, label: "<="},
  { value: FILTER.OPERATORS.NUMBER.EQ, label: "="},
  { value: FILTER.OPERATORS.NUMBER.NOT_EQ, label: `\u2260`},
]

/*/

  NumberFilter

  props
      {
        group       // node or edge
        filter: {
          id,
          type,     // filter type, e.g "string" vs "number"
          key,      // node field key from the template
          keylabel, // human friendly display name for the key.  This can be customized in the template.
          operator,
          value
        },
        onChangeHandler // callback function
      }


/*/
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
    const { id, type, key, keylabel } = this.props.filter;

    // Allow NO_OP so user can reset operator to blank
    // if (this.state.operator === FILTER.OPERATORS.NUMBER.NO_OP) return;

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
      filter
    }); // set a SINGLE filter
  }

  render() {
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
              <option value={op.value} key={`${id}${op.value}`} size="sm">{op.label}</option>
            )}
          </Input>
          <Input type="text" value={value} placeholder="..."
            onChange={this.OnChangeValue} bsSize="sm" />
        </FormGroup>
      </Form>
    );
  }
}

export default NumberFilter;
