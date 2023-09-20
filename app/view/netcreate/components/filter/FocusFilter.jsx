/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FOCUSFILTER

  FocusFilter provides the UI for entering the numeric range value for
  the focus filter.

  Selection changes directly trigger a UDATA.LocalCall('FILTER_DEFINE',...).

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const ReactStrap = require('reactstrap');
const { Form, FormGroup, Input, Label } = ReactStrap;
const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UDATA = null;

/// CLASS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class FocusFilter extends React.Component {
  constructor({ focusRange }) {
    super();
    this.OnChangeValue = this.OnChangeValue.bind(this);
    this.TriggerChangeHandler = this.TriggerChangeHandler.bind(this);
    this.OnSubmit = this.OnSubmit.bind(this);

    this.state = {
      focusRange: focusRange // Used locally to define result
    };

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);
  }

  OnChangeValue(e) {
    // The built in <input min="0"> will keep the step buttons from going below 0,
    // but the user can still input "0".  We can't just use Math.min() because the
    // user would not be allowed to use backspace to delete the value before
    // entering a new number.  Replacing invalid numbers with a blank value
    // feels like a  more natural way of editing.
    const focusRange = e.target.value < 1 ? '' : e.target.value;
    this.setState({ focusRange }, this.TriggerChangeHandler);
  }

  TriggerChangeHandler() {
    // even though we allow "" in the field, we always define the range to be 1
    // so that something will show
    const focusRange = this.state.focusRange < 1 ? 1 : this.state.focusRange;
    if (UDATA)
      UDATA.LocalCall('FILTER_DEFINE', {
        group: 'focus',
        filter: {
          value: focusRange
        }
      }); // set a SINGLE filter
  }

  OnSubmit(e) {
    // Prevent "ENTER" from triggering form submission!
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    const { focusSourceLabel } = this.props;
    const { focusRange } = this.state;
    return (
      <div
        className="filter-group"
        style={{
          margin: '5px 5px 5px 0',
          padding: '10px',
          backgroundColor: 'rgba(0,0,0,0)'
        }}
      >
        <Form inline className="filter-item" onSubmit={this.OnSubmit}>
          {/* FormGroup needs to unset flexFlow or fields will overflow
              https://getbootstrap.com/docs/4.5/utilities/flex/
          */}
          <FormGroup className="flex-nowrap">
            <Label size="sm" className="small text-muted">
              Selected Node: {focusSourceLabel}
            </Label>
            <br />
          </FormGroup>
          <FormGroup className="flex-nowrap">
            <Label size="sm" className="small text-muted">
              Range <i>(&gt;0)</i>:&nbsp;
            </Label>
            <Input
              type="number"
              min="1"
              style={{ maxWidth: '12em', height: '1.5em', padding: '2px' }}
              bsSize="sm"
              onChange={this.OnChangeValue}
              value={focusRange}
            />
          </FormGroup>
        </Form>
      </div>
    );
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = FocusFilter;
