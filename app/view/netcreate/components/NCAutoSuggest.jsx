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

    onSelect(parentKey, value, id)
        -- returns `state` and `value` for the final submission as well as the
           matching id.  `value` is then passed back to NCAutoSuggest as the
           search field input value.

  This will look up matching nodes via FIND_MATCHING_NODES nc-logic request.

  This is a simple HTML component that will allow users to enter arbitrary
  text input.  Any partial node labels will display as a list of popup
  menu options.

  It can be used in a NCSearch or NCEdge
  (NOTE NCNode does not not use NCAutoSuggest, but displays a matchlist using
  a mechanism similar to NCAutoSuggest -- the key difference is that NCNode's
  matchlist is simply a static display list to let you know which nodes match
  the current input field, and does NOT support selecting a match.)

  `parentKey` provides a unique key to determine whether this NCAutoSuggest
  component is being used for a `search`, a `source`, or a `target` selection

  Replaces the deprecated AutoComplete and AutoSuggest components.

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
      isValidNode: true,
      uShowMatchlist: false
    };

    this.m_UIInputFocus = this.m_UIInputFocus.bind(this);
    this.m_UIInputClick = this.m_UIInputClick.bind(this);
    this.m_UIUpdate = this.m_UIUpdate.bind(this);
    this.m_UISelectByLabel = this.m_UISelectByLabel.bind(this);
    this.m_UISelectById = this.m_UISelectById.bind(this);
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
   * User has clicked inside the input field to set selection point
   * This is needed to restore the selection point after a blur
   * `focus` fires before `click`
   */
  m_UIInputFocus(event) {
    event.target.select();
    this.m_UIUpdate(event);
  }

  /**
   * User has clicked in the input field, so update and show the matchlist
   * and catch the event to prevent the document click handler from firing other actions
   */
  m_UIInputClick(event) {
    event.preventDefault(); // this prevents the document click handler from closing the matchlist
    event.stopPropagation();
    this.setState({ uShowMatchlist: true });
  }

  /**
   * User has typed in the input field, or the field is getting focus again.
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
      this.setState({ matches, isValidNode, uShowMatchlist: true });
      if (typeof onChange === 'function')
        onChange(key, value, () => {
          // restore  selection cursor position
          inputEl.selectionStart = selstart;
          inputEl.selectionEnd = selstart;
        });
    });
  }
  /**
   * User has clicked an item in the matchlist,
   * or selected an item by typing ENTER
   * selecting one of the autosuggest items
   * @param {Object} event
   * @param {string} parentKey Either `search`, `source` or `target`
   * @param {string} value The autosuggest input value
   */
  m_UISelectByLabel(event, parentKey, value) {
    event.preventDefault(); // catch click to close matchlist
    event.stopPropagation();
    const { onSelect } = this.props;
    const { matches } = this.state;
    const matchedNodeViaID = matches ? matches.find(n => n.id === value) : undefined;
    this.setState({
      isValidNode: matchedNodeViaID,
      matches: [],
      higlightedLine: -1,
      uShowMatchlist: false
    }); // clear matches
    if (typeof onSelect === 'function') {
      onSelect(
        parentKey,
        value,
        matchedNodeViaID ? matchedNodeViaID.id : undefined // ...or id, not both
      ); // callback function NCEdge.uiSourceTargetInputUpdate
    }
  }

  m_UISelectById(event, parentKey, id) {
    event.preventDefault(); // catch click to close matchlist
    event.stopPropagation();
    const { onSelect, value } = this.props;
    const { matches } = this.state;
    const matchedNodeViaID = matches ? matches.find(n => n.id === id) : undefined;
    this.setState({
      isValidNode: matchedNodeViaID,
      matches: [],
      higlightedLine: -1,
      uShowMatchlist: false
    }); // clear matches
    if (typeof onSelect === 'function') {
      onSelect(
        parentKey,
        value, // show the current input field value
        matchedNodeViaID ? matchedNodeViaID.id : undefined // ...or `id`, not both
      ); // callback function NCEdge.uiSourceTargetInputUpdate
    }
  }

  /**
   * Handle key strokes
   * --  Typing UP/DOWN arrow will select the higlight
   * --  Typing ESC will cancel the autosuggest, also hitting Tab will prevent selecting the next field
   * --  Typing ENTER will select the item
   * @param {Object} event
   */
  m_UIKeyDown(event) {
    const { matches, higlightedLine } = this.state;
    const { parentKey, value, onSelect } = this.props;
    const keystroke = event.key;
    const lastLine = matches ? matches.length : -1;
    let newHighlightedLine = higlightedLine;
    if (keystroke === 'Enter') {
      if (higlightedLine > -1 && matches) {
        // make sure matches exists, b/c hitting Enter with a typo can end up with bad match
        // there is highlight, so select that using the id in the matchlist
        const id = matches[higlightedLine].id;
        this.m_UISelectById(event, parentKey, id); // user selects current highlight
      } else if (value !== '') {
        // Create a new node -- see also NCSearch
        this.m_UISelectByLabel(event, parentKey, value); // user selects current highlight
      }
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
      this.m_UIHighlightLine(newHighlightedLine);
    }
  }

  m_UIMouseHighlightLine(event, line) {
    this.m_UIHighlightLine(line);
  }
  m_UIMouseUnhighlightLine(event) {
    // Placeholder for future functionality
    // Catch the event, but don't do anything.
    // We want to keep the matchlist open even if you move the mouse
    // outside of the line.
  }

  m_UIHighlightLine(line) {
    const { matches } = this.state;
    const lastLine = matches ? matches.length : -1;
    line = Math.min(lastLine - 1, Math.max(0, line));
    this.setState({ higlightedLine: line, uShowMatchlist: true });
    const highlightedNode = matches[line];
    UDATA.LocalCall('AUTOSUGGEST_HILITE_NODE', { nodeId: highlightedNode.id });
  }

  // Clicking outside of the matchlist should close the autosuggest
  m_UIClickOutside(event) {
    if (event.defaultPrevented)
      return; // clicking on the input field or the matchlist catches the click and prevents inadvertently closing the matchlist
    else this.setState({ matches: [], higlightedLine: -1, uShowMatchlist: false }); // close matchlist
  }

  render() {
    const { matches, higlightedLine, isValidNode, uShowMatchlist } = this.state;
    const { parentKey, value, onSelect } = this.props;
    const matchList =
      matches && matches.length > 0
        ? matches.map((n, i) => (
            <div
              key={`${n.label}${i}`}
              value={n.label}
              className={higlightedLine === i ? 'highlighted' : ''}
              onClick={event => this.m_UISelectById(event, parentKey, n.id)}
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
          onFocus={this.m_UIInputFocus}
          onClick={this.m_UIInputClick}
          autoComplete="off" // turn off Chrome's default autocomplete, which conflicts
        />
        <br />
        {uShowMatchlist && matchList && (
          <div
            id="matchlist"
            className="matchlist"
            onMouseLeave={this.m_UIMouseUnhighlightLine}
          >
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
