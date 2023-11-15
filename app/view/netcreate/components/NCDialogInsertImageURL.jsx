/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Image URL Input Dialog

  Dialog that shows an input field for pasting an image URL into a Node or Edge.
  If the URL is correct, the image will be previewed.

  USE:

    <NCDialogInput
      message="Paste image URL:"
      okmessage="Insert"
      onOK={event => m_UIPasteImageURL(event, key, cb)}
      cancelMessage="Cancel"
      onSCancel={m_UICancleInsertImageURL}
    />

  TO OPEN the DIALOG:

    UDATA.LocalCall("IMAGE_URL_DIALOG_OPEN")

  This will look up matching nodes via FIND_MATCHING_NODES nc-logic request.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCDialogInput';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let UDATA;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NCDialogInsertImageURL extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      url: ''
    };
    this.m_UIOpenDialog = this.m_UIOpenDialog.bind(this);
    this.m_UIInputChange = this.m_UIInputChange.bind(this);
    this.m_UIOnOK = this.m_UIOnOK.bind(this);
    this.m_UIOnCancel = this.m_UIOnCancel.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);
    UDATA.HandleMessage('IMAGE_URL_DIALOG_OPEN', this.m_UIOpenDialog);
  }

  componentWillUnmount() {
    UDATA.UnhandleMessage('IMAGE_URL_DIALOG_OPEN', this.m_UIOpenDialog);
  }

  m_UIOpenDialog() {
    this.setState({ isOpen: true });
  }

  m_UIInputChange(event) {
    this.setState({ url: event.target.value });
  }

  m_UIOnOK() {
    const { url } = this.state;
    const { onOK } = this.props;
    this.setState({ isOpen: false });
    onOK && onOK(url);
  }

  m_UIOnCancel() {
    const { onCancel } = this.props;
    this.setState({ isOpen: false });
    onCancel && onCancel();
  }

  render() {
    const { isOpen, url } = this.state;
    const {
      message = 'Are you sure?',
      okmessage = 'OK',
      cancelmessage = 'Cancel',
      onOK,
      onCancel
    } = this.props;
    const OKBtn = <button onClick={this.m_UIOnOK}>{okmessage}</button>;
    const CancelBtn = <button onClick={this.m_UIOnCancel}>{cancelmessage}</button>;

    return !isOpen ? (
      ''
    ) : (
      <div className="dialog">
        <div className="screen"></div>
        <div className="dialogwindow">
          <div className="dialogmessage">
            <h1>ADD IMAGE URL</h1>
            <hr />
            <div className="label">PREVIEW:</div>
            <div className="preview">
              <img src={url} alt="Pasted Image URL" />
            </div>
            <hr />
            <div>{message}</div>
            <input onChange={this.m_UIInputChange} />
          </div>
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
module.exports = NCDialogInsertImageURL;
