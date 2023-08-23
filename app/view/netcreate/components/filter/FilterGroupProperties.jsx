import FILTER from './FilterEnums';
import React from 'react';
const ReactStrap = require('reactstrap');
const { Form, FormGroup, Input, Label } = ReactStrap;

const UNISYS = require('unisys/client');
var UDATA = null;

class FilterGroupProperties extends React.Component {
  // Currently inconsistent because not passing in a key, etc.
  // if we expand on this notion of group-leve globals we'll need to update
  // the format / approach

  constructor({ group, transparency }) {
    super();
    this.OnChangeValue = this.OnChangeValue.bind(this);
    this.TriggerChangeHandler = this.TriggerChangeHandler.bind(this);
    this.OnSubmit = this.OnSubmit.bind(this);

    this.state = {
      group: group,
      transparency: transparency
    };

    UDATA = UNISYS.NewDataLink(this);
  }

  OnChangeValue(e) {
    this.setState(
      {
        transparency: e.target.value
      },
      this.TriggerChangeHandler
    );
  }

  // this is overkill to have these be separate, but mirroring the other filter components and aiming
  // to have future additional properties here, so this way the flow won't change (change functions call trigger change)
  TriggerChangeHandler() {
    // for debugging
    // console.log(
    //   'Filter group for ' +
    //     this.state.group +
    //     ' setting transparency to ' +
    //     this.state.transparency
    // );

    // set the transparency globally for this group (nodes or edges)
    UDATA.LocalCall('FILTER_DEFINE', {
      group: this.state.group,
      type: 'transparency',
      transparency: this.state.transparency
    }); // set a SINGLE filter

    // trigger a refresh of the filters if its not already done?
    //UDATA.SetAppState("FILTERDEFS", fdata);
  }

  OnSubmit(e) {
    // Prevent "ENTER" from triggering form submission!
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    const { group, transparency } = this.props;
    return (
      <div>
        <br />
        <Form inline className="filter-item" key={group} onSubmit={this.OnSubmit}>
          <FormGroup>
            <Label
              size="sm"
              className="small text-muted"
              style={{
                fontSize: '0.75em',
                lineHeight: '1em',
                width: `5em`,
                marginLeft: '0em'
              }}
            >
              Transparency&nbsp;
            </Label>
            <Input
              type="text"
              value={transparency}
              style={{ maxWidth: '9em', height: '1.5em', marginLeft: '1em' }}
              onChange={this.OnChangeValue}
              bsSize="sm"
            />
          </FormGroup>
        </Form>
      </div>
    );
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default FilterGroupProperties;
