/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Custom Auto Suggest for NetCreate

  USE:

    <NCAutoSuggest
      parentKey={key}
      value={value}
      onChange={this.handleInputUpdate}
      onSelect={this.handleSelection}
    />

  PROPS

    onChange(key, value) -- returns `key` and `value` for the input field

    onSelect(parentKey, value, id) -- returns `state` and `value` for the final submission
                                  as well as the matching id

  This will look up matching nodes via FIND_MATCHING_NODES nc-logic request.

  This is a simple HTML component that will allow users to enter arbitrary
  text input.  Any partial node labels will display as a list of popup
  menu options.

  It can be used in a NCNode or NCEdge

  `parentKey` provides a unique key to determine whether this NCAutoSuggest
  component is being used for a `search`, a `source`, or a `target` selection

  Replaces the AutoComplete and AutoSuggest components.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCAutoSuggest';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
    this.m_UIMouseHighlightLine = this.m_UIMouseHighlightLine.bind(this);
    this.m_UIMouseUnhighlightLine = this.m_UIMouseUnhighlightLine.bind(this);
    this.m_UIHighlightLine = this.m_UIHighlightLine.bind(this);
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

    // save the selection cursor position
    const selstart = event.target.selectionStart;
    const inputEl = event.target;

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
      if (typeof onChange === 'function')
        onChange(key, value, () => {
          // restore  selection cursor position
          inputEl.selectionStart = selstart;
          inputEl.selectionEnd = selstart;
        });
    });
  }
  /**
   * User has clicked an item in the matchlist, selecting one of the autosuggest items
   * @param {Object} event
   * @param {number} id
   * @param {string} parentKey Either `search`, `source` or `target`
   */
  m_UISelect(event, parentKey, value) {
    event.preventDefault(); // catch click to close matchlist
    event.stopPropagation();
    const { onSelect } = this.props;
    const { matches } = this.state;
    const matchedNode = matches ? matches.find(n => n.id === id) : undefined;
    this.setState({ isValidNode: matchedNode, matches: [], higlightedLine: -1 }); // clear matches
    if (typeof onSelect === 'function')
      onSelect(
        matchedNode ? matchedNode.value : undefined,
        matchedNode ? matchedNode.id : undefined
        parentKey,
      ); // callback function NCEdge.uiSourceTargetInputUpdate
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
    const { parentKey, value, onSelect } = this.props;
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
  m_UIMouseHighlightLine(event, line) {
    this.m_UIHighlightLine(line);
  }
  m_UIMouseUnhighlightLine(event) {
    // Placeholder for future functionality
    // Catch the event, but don't do anything.
    // We want to keep the matchlist open even if you move the mouse
    // outside of the line.
  }
    }
  }

  render() {
    const { matches, higlightedLine, isValidNode } = this.state;
    const { parentKey, value, onSelect } = this.props;
    const matchList =
      matches && matches.length > 0
        ? matches.map((n, i) => (
            <div
              key={`${n.label}${i}`}
              value={n.label}
              className={higlightedLine === i ? 'highlighted' : ''}
              onClick={event => this.m_UISelect(event, parentKey, n.id)}
              onMouseEnter={event => this.m_UIMouseHighlightLine(event, i)}
            >
              {n.label} <span className="id">#{n.id}</span>
            </div>
          ))
        : undefined;
    return (
      <div style={{ position: 'relative', flexGrow: '1' }}>
        <div className="helptop">Click on a node, or type a node name</div>
        <input
          id={parentKey}
          key={`${parentKey}input`}
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
