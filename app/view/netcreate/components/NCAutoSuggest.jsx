/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Custom Auto Suggest for NetCreate

    USE:

      <NCAutoSuggest
        statekey={key}
        value={value}
        onChange={this.handleInputUpdate}
        onSelect={this.handleSelection}
      />

    PROPS

      onChange(key, value) -- returns `key` and `value` for the input field
      onSelect(key, valuem, id) -- returns `key` and `value` for the final submission
                                   as well as the matching id

    This will look up matching nodes via FIND_MATCHING_NODES nc-logic request.

    This is a simple HTML component that will allow users to enter arbitrary
    text input.  Any partial node labels will display as a list of popup
    menu options.

    It can be used in a NCNode or NCEdge

    `statekey` provides a unique key for source/target selection

    Replaces the AutoComplete and AutoSuggest components.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'NCAutoSuggest';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UNISYS = require('unisys/client');

let UDATA;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCAutoSuggest extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      matches: [], // {id, label}
      higlightedLine: -1,
      isValidNode: true
    };

    this.m_UIUpdate = this.m_UIUpdate.bind(this);
    this.m_UISelect = this.m_UISelect.bind(this);
    this.m_UIKeyDown = this.m_UIKeyDown.bind(this);
    this.m_UIClickOutside = this.m_UIClickOutside.bind(this);

    document.addEventListener('click', this.m_UIClickOutside);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.m_UIClickOutside);
  }

  /**
   * This processes the form data before passing it on to the parent handler.
   * The callback function is generally an input state update method in
   * NCNode or NCEdge
   * @param {Object} event
   */
  m_UIUpdate(event) {
    const { onChange } = this.props;
    const key = event.target.id;
    const value = event.target.value;
    let isValidNode = false;
    UDATA.LocalCall('FIND_MATCHING_NODES', { searchString: value }).then(data => {
      const matches =
        data.nodes && data.nodes.length > 0
          ? data.nodes.map(d => {
              if (d.label === value) isValidNode = true;
              return { id: d.id, label: d.label };
            })
          : undefined;
      this.setState({ matches, isValidNode });
      if (typeof onChange === 'function') onChange(key, value);
    });
  }
  /**
   * User has clicked an item in the matchlist, selecting one of the autosuggest items
   * @param {Object} event
   * @param {string} key Usually either `source` or `target`
   * @param {string} value
   */
  m_UISelect(event, key, value) {
    event.preventDefault(); // catch click to close matchlist
    event.stopPropagation();
    const { onSelect } = this.props;
    const { matches } = this.state;
    const matchedNode = matches ? matches.find(n => n.label === value) : undefined;
    this.setState({ isValidNode: matchedNode, matches: [], higlightedLine: -1 }); // clear matches
    if (typeof onSelect === 'function')
      onSelect(key, value, matchedNode ? matchedNode.id : undefined); // callback function NCEdge.uiSourceTargetInputUpdate
  }
  /**
   * Handle key strokes
   * --  Hitting up/down arrow will select the higlight
   * --  Hitting Esc will cancel the autosuggest, also hitting Tab will prevent selecting the next field
   * --  Hitting Enter will select the item
   * @param {Object} event
   */
  m_UIKeyDown(event) {
    const { matches, higlightedLine } = this.state;
    const { statekey, value, onSelect } = this.props;
    const keystroke = event.key;
    const lastLine = matches ? matches.length : -1;
    let newHighlightedLine = higlightedLine;
    if (keystroke === 'Enter') {
      let selectedValue = value;
      if (higlightedLine > -1) {
        // there is highlight, so select that
        selectedValue = matches[higlightedLine].label;
      }
      this.m_UISelect(event, statekey, selectedValue); // user selects current highlight
    }
    if (keystroke === 'Escape' || keystroke === 'Tab') {
      event.preventDefault(); // prevent tab key from going to the next field
      event.stopPropagation();
      this.setState({ matches: [], higlightedLine: -1 }); // close autosuggest
    }
    if (keystroke === 'ArrowUp') newHighlightedLine--;
    if (keystroke === 'ArrowDown') newHighlightedLine++;
    if (
      higlightedLine !== newHighlightedLine &&
      newHighlightedLine > -1 &&
      lastLine > 0
    ) {
      newHighlightedLine = Math.min(lastLine - 1, Math.max(0, newHighlightedLine));
      this.setState({ higlightedLine: newHighlightedLine });
      const highlightedNode = matches[newHighlightedLine];
      UDATA.LocalCall('AUTOSUGGEST_HILITE_NODE', { nodeId: highlightedNode.id });
    }
  }

  m_UIClickOutside(event) {
    if (!event.defaultPrevented) {
      this.setState({ matches: [], higlightedLine: -1 }); // close autosuggest
    }
  }

  render() {
    const { matches, higlightedLine, isValidNode } = this.state;
    const { statekey, value, onSelect } = this.props;
    const matchList =
      matches && matches.length > 0
        ? matches.map((n, i) => (
            <div
              key={`${n.label}${i}`}
              value={n.label}
              className={higlightedLine === i ? 'highlighted' : ''}
              onClick={event => this.m_UISelect(event, statekey, n.label)}
            >
              {n.label}
            </div>
          ))
        : undefined;
    return (
      <div style={{ position: 'relative' }}>
        <div className="helptop">Click on a node, or type a node name</div>
        <input
          id={statekey}
          key={`${statekey}input`}
          value={value}
          type="string"
          className={!isValidNode ? 'invalid' : ''}
          onChange={this.m_UIUpdate}
          onKeyDown={this.m_UIKeyDown}
          onFocus={e => e.target.select()}
          autoComplete="off" // turn off Chrome's default autocomplete, which conflicts
        />
        <br />
        {matchList && (
          <div id="matchlist" className="matchlist">
            {matchList}
          </div>
        )}
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCAutoSuggest;
