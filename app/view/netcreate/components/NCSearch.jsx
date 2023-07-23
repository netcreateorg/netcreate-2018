/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Prototype Simple NetCreate Search Field

    Built for Version 2.0 ITEST.

    Provides a:
    * Search Field
    * "Add New Node" button
    * Autosuggest highlighter

    USAGE

      <NCSearch />

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'NCSearch';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UNISYS = require('unisys/client');
const NCAutoSuggest = require('./NCAutoSuggest');

let UDATA;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCSearch extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: false,
      value: ''
    }; // initialized on componentDidMount and clearSelection

    this.UpdateSession = this.UpdateSession.bind(this);
    this.UIOnChange = this.UIOnChange.bind(this);
    this.UIOnSelect = this.UIOnSelect.bind(this);
    this.UINewNode = this.UINewNode.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// REGISTER LISTENERS
    UDATA.OnAppStateChange('SESSION', this.UpdateSession);
  }

  componentWillUnmount() {
    UDATA.AppStateChangeOff('SESSION', this.UpdateSession);
  }

  /**
   * Handle change in SESSION data
   * SESSION is called by SessionShell when the ID changes
   * set system-wide. data: { classId, projId, hashedId, groupId, isValid }
   * Called both by componentWillMount() and AppStateChange handler.
   * The 'SESSION' state change is triggered in two places in SessionShell during
   * its handleChange() when active typing is occuring, and also during
   * SessionShell.componentWillMount()
   */
  UpdateSession(decoded) {
    this.setState({ isLoggedIn: decoded.isValid });
  }

  UIOnChange(key, value) {
    // Pass the input value (node label search string) to UDATA
    // which will in turn pass the searchLabel back to the SEARCH
    // state handler in the constructor, which will in turn set the state
    // of the input value to be passed on to AutoSuggest
    this.AppCall('SOURCE_SEARCH', { searchString: value });
    // Update current input value
    this.setState({ value });
  }

  UIOnSelect(key, value, id) {
    // match existing vs create new
    this.setState({ value }, () => {
      if (id) {
        // open existing node
        UDATA.LocalCall('D3_SELECT_NODE', { nodeIDs: [id] });
      } else {
        // create a new node
        this.UINewNode();
      }
    }); // Enter will create a new node
  }

  UINewNode() {
    const { value } = this.state;
    const data = {};
    data.label = value;
    UDATA.LocalCall('NODE_CREATE', data).then(node => {
      UDATA.LocalCall('D3_SELECT_NODE', { nodeIDs: [node.id] });
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// MAIN RENDER
  ///
  render() {
    const { value, isLoggedIn } = this.state;
    const newNodeBtnDisabled = !isLoggedIn || value === '';
    const key = 'search'; // used for source/target, placeholder for search
    return (
      <div className="ncsearch">
        <NCAutoSuggest
          statekey={key}
          value={value}
          onChange={this.UIOnChange}
          onSelect={this.UIOnSelect}
        />
        <button disabled={newNodeBtnDisabled} onClick={this.UINewNode}>
          New Node
        </button>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCSearch;
