/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Generic Dialog

    USE:

      <NCDialog
        statekey={key}
        value={value}
        onChange={this.handleInputUpdate}
        onSelect={this.handleSelection}
      />

    This will look up matching nodes via FIND_MATCHING_NODES nc-logic request.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'NCDialog';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NCDialog extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      message = 'Are you sure?',
      okmessage = 'OK',
      cancelmessage = 'Cancel',
      onOK,
      onCancel
    } = this.props;
    const OKBtn = <button onClick={onOK}>{okmessage}</button>;
    const CancelBtn = onCancel ? (
      <button onClick={onCancel}>{cancelmessage}</button>
    ) : (
      ''
    );
    return (
      <div className="dialog">
        <div className="screen"></div>
        <div className="dialogwindow">
          <div className="dialogmessage">{message}</div>
          <div className="dialogcontrolbar">
            {CancelBtn}
            {`\u00a0`}
            {OKBtn}
          </div>
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCDialog;
