/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Citation Dialog

  USE:

    <NCDialogCitation
      message={message}
      copymessage={'Copy to Clipboard"}
      onClose={this.UIHandleClose}
    />

  This display citation text with a "Copy to Clipboard" button.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCDialogCitation';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NCDialogCitation extends React.Component {
  constructor(props) {
    super(props);
    this.state = { copiedMessage: '' };
    this.m_UIOnCopy = this.m_UIOnCopy.bind(this);
  }

  m_UIOnCopy() {
    const { onClose } = this.props;
    const messageEl = document.querySelector('#citationMessage');
    messageEl.select();
    document.execCommand('copy'); // deprecated, but other techniques require HTTPS
    if (typeof onClose === 'function') {
      this.setState({ copiedMessage: 'Copied to Clipboard!' }, () =>
        setTimeout(onClose, 500)
      );
    }
  }

  render() {
    const { copiedMessage } = this.state;
    const {
      message = 'message',
      copymessage = 'Copy to Clipboard',
      onClose
    } = this.props;
    const CopyBtn = <button onClick={this.m_UIOnCopy}>{copymessage}</button>;
    return (
      <div className="dialog">
        <div className="screen"></div>
        <div className="dialogwindow">
          <div className="dialogmessage">
            <textarea
              id="citationMessage"
              defaultValue={message}
              rows="5"
              cols="60"
              readOnly
              style={{
                fontSize: '12px',
                fontStyle: 'italic',
                padding: '5px 10px',
                border: 'none',
                color: '#333',
                background: '#eef'
              }}
            />
          </div>
          <div className="dialogcontrolbar">
            {copiedMessage} {CopyBtn}
          </div>
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCDialogCitation;
