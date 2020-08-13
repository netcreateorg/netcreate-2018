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

/*/

  SelectFilter

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
class SelectFilter extends React.Component {

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
    const { id, type, key, keylabel, options } = this.props.filter;

    // Allow NO_OP so user can reset operator to blank
    // if (this.state.operator === FILTER.OPERATORS.NUMBER.NO_OP) return;

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
    console.error('setting option to ', this.props.filter.options[0]);
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

export default SelectFilter;
