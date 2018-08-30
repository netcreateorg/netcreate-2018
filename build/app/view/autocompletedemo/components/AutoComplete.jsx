/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

      ## OVERVIEW

      AutoComplete is the text input field for entering node labels to:
      * search for nodes,
      * edit existing nodes,
      * and add new nodes.
      * view the current selection/setting when searching for a node
      * view the current selection/setting for an edge source or target



      ## MAIN FEATURES

      * It interactively provides a list of suggestions that match the current
        input, e.g. typing "ah" will display a list of suggestions including "Ah
        Long", "Ah Seung", and "Oahu Railroad Station".

      * Users can highlight suggestions (via mouseover or with keyboard arrows)

      * Users can select a suggestion (via clicking or hitting return)

      * Only one AutoComplete component can be active at a time in an app.
        Since there can be multiple AutoComplete components on a single page
        (e.g. multiple edges along with the source), we disable the component
        when it isn't active.

      * When the AutoComplete component is disabled, it will display a
        generic INPUT component instead of the Autosuggest component.

      * When the AutoComplete component is disabled, since it will not
        receive SELECTION updates, we need to pass it the current field
        value via the this.props.disabledValue.

      AutoComplete is a wrapper class for the open source AutoSuggest component,
      which handles the actual rendering of the suggestions list.  AutoComplete
      provides an interface to NodeSelector and EdgeEntry.  AutoComplete also
      provides the handler routines for generating the suggestions list and
      handling highlights and selections.  Data is passed to AutoComplete via
      UDATA SELECTION state changes.

      This relies on the react-autosuggest component.
      See documentation: https://github.com/moroshko/react-autosuggest



      ## TO USE

          <AutoComplete
            isDisabled={this.state.canEdit}
            disabledValue={this.state.formData.label}
            inactiveMode={'disabled'}
          />



      ## TECHNICAL DESCRIPTION

      AutoComplete handles five basic functions:

      1. Show suggestions when the user types in the input search field.
      2. Mark nodes on graph when the user changes the search field.
      3. Set selection when user clicks on a suggestion.
      4. Show the label if the node is selected externally
         (via a click on the graph)
      5. Provide an edit field for the label when the user is editing a node
         (during edit, show suggestions, but don't select anything?)

      The Autosuggest input field is a controlled field.
      It is controlled via this.state.value.
      See https://reactjs.org/docs/forms.html#controlled-components

      Sequence of Events

      1. When the user types in the Autosuggest input field,
      2. AutoComplete makes a UDATA SOURCE_SEARCH call
      3. autocomplete-logic handles the call and returns a SELECTION state update
      4. AutoComplete then sets the Autosuggest input field value via
         this.state.value.
      5. The updated SELECTION state also contains a list of
         suggestedNodeLabels that is used by Autosuggest whenever it
         requests a list of suggestions.



      ## HIGHLIGHTING vs MARKING

      "Highlighting" refers to the temporary rollover highlight of a suggested node
      in the suggestion list.  "Marking" refers to the stroked color of a node
      circle on the D3 graph.



      ## PROPS

      identifier

            A unique ID for identifying which AutoComplete component is active
            within the whole app system.

      disabledValue

            When the AutoComplete component is not active, it should display
            the currently selected node (rather than be an active input field
            for selecting a new node).  This is the label for that node.

      inactiveMode

            When the AutoComplete component is not active, it can be either
            'static' or 'disabled' depending on the parent field.  This prop
            sets which of these modes the field should default to:

            'static'   -- an unchangeable field, e.g. the Source node for an
                          edge is always going to be the Source label.  It
                          cannot be changed.
            'disabled' -- a changeable field that is not currently activated,
                          e.g. the Target node for an edge.

      shouldIgnoreSelection

            Used by NodeSelector and EdgeEditor's target node field
            to prevent user from selecting another node
            while editing a node.

      Based on example code from https://codepen.io/moroshko/pen/vpBzMr

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React       = require('react');
const ReactStrap  = require('reactstrap');
const { Input }   = ReactStrap;
const Autosuggest = require('react-autosuggest');

const UNISYS      = require('unisys/client');

const MODE_STATIC   = 'static';   // Can't be edited ever
const MODE_DISABLED = 'disabled'; // Can be edited, but not at the moment
const MODE_ACTIVE   = 'active';   // Currently able to edit

var   _IsMounted  = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class AutoComplete extends UNISYS.Component {

    constructor() {
      super();
      this.state = {
        value       : '',
        suggestions : [],
        id          : '',
        mode        : MODE_DISABLED
      };

      this.onStateChange_SEARCH        = this.onStateChange_SEARCH.bind(this);
      this.onStateChange_SELECTION     = this.onStateChange_SELECTION.bind(this);
      this.onStateChange_AUTOCOMPLETE  = this.onStateChange_AUTOCOMPLETE.bind(this);
      this.onInputChange               = this.onInputChange.bind(this);
      this.getSuggestionValue          = this.getSuggestionValue.bind(this);
      this.renderSuggestion            = this.renderSuggestion.bind(this);
      this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
      this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
      this.onSuggestionSelected        = this.onSuggestionSelected.bind(this);
      this.onSuggestionHighlighted     = this.onSuggestionHighlighted.bind(this);
      this.shouldRenderSuggestions     = this.shouldRenderSuggestions.bind(this);

      // NOTE: do this AFTER you have used bind() on the class method
      // otherwise the call will fail due to missing 'this' context
      this.OnAppStateChange('SEARCH',             this.onStateChange_SEARCH);
      this.OnAppStateChange('SELECTION',          this.onStateChange_SELECTION);
      this.OnAppStateChange('ACTIVEAUTOCOMPLETE', this.onStateChange_AUTOCOMPLETE);

    } // constructor

/// UNISYS STATE CHANGE HANDLERS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ 'SEARCH' handler
/*/ onStateChange_SEARCH ( data ) {
      // grab entire global state for 'SELECTION
      // REVIEW // autocompleteid probab;y should be stored elsewhere or use a
      // different mechanism
      if (DBG) console.log('AutoComplete',this.props.identifier,': Got SEARCH',data);
      let { activeAutoCompleteId } = this.AppState('ACTIVEAUTOCOMPLETE');
      if (activeAutoCompleteId===this.props.identifier) {
        // This is the currently active AutoComplete field
        // Update the autosuggest input field's value with the current search data
        if (DBG) console.log('...AutoComplete',this.props.identifier,': ACTIVE setting search value to',data.searchLabel);
        if (data.searchLabel!==undefined) {
          this.setState({
            mode  : MODE_ACTIVE,
            value : data.searchLabel
          });
        }
      } else {
        // This is not the active AutoComplete field
        // Use the disabledValue prop to display
        // REVIEW: this probably is handled better in render()
        if (_IsMounted) {
          if (DBG) console.log('...AutoComplete',this.props.identifier,': NOT ACTIVE setting search value to',this.props.disabledValue);
          this.setState({
            mode    : this.props.inactiveMode,
            value   : this.props.disabledValue
          });
        } else {
          if (DBG) console.log('...AutoComplete',this.props.identifier,': NOT ACTIVE, but skipping update because component is unmounted');
        }
      }
    } // onStateChange_SEARCH

/*/ 'SELECTION' handler
    Update this AutoComplete input value when the currently selected SELECTION has changed
    AND we are active and have the current activeAutoCompleteId.
    This is especially important for when adding a target field to a new EdgeEditor.
/*/ onStateChange_SELECTION ( data ) {
      if (DBG) console.log('...AutoComplete',this.props.identifier,': Got SELECTION',data);
      if (this.props.shouldIgnoreSelection) {
        if (DBG) console.error('...AutComplete',this.props.identifier,': Ignoring SELECTION (probably because NodeSelector is in edit mode).');
        return;
      }
      let activeAutoCompleteId = this.AppState('ACTIVEAUTOCOMPLETE').activeAutoCompleteId;
      if ( (this.props.identifier===activeAutoCompleteId) ||
           (activeAutoCompleteId==='search') ) {
        // Update the searchLabel if either this nodeSelector or the 'search' field is
        // is the current active AutoComplete field.
        // We only ignore SELECTION updates if an edge target field has the current focus.
        // This is necessary for the case when the user clicks on a node in the D3 graph
        // and the search field has the current AutoComplete focus.  Otherwise the state.value
        // is never updated.
        if (DBG) console.log('...AutoComplete',this.props.identifier,': ACTIVE got SELECTION');
        let nodes = data.nodes;
        if (nodes!==undefined &&
            nodes.length>0 &&
            nodes[0]!==undefined &&
            nodes[0].label!==undefined) {
          let searchLabel = nodes[0].label;
          if (DBG) console.log('...AutoComplete',this.props.identifier,': ACTIVE got SELECTION, searchLabel',searchLabel);
          this.setState({value: searchLabel});
        }
      }
    }

/*/ 'AUTOCOMPLETE' handler
    Update this AutoComplete state when the currently selected AUTOCOMPLETE field has changed
/*/ onStateChange_AUTOCOMPLETE ( data ) {
      if (DBG) console.log('...AutoComplete',this.props.identifier,': Got AUTOCOMPLETE',data);
      let mode = this.state.mode;
      if (data.activeAutoCompleteId === this.props.identifier) {
        mode = MODE_ACTIVE;
      } else {
        mode = this.props.inactiveMode;
      }
      this.setState({mode: mode});
    }

/// AUTOSUGGEST HANDLERS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle Autosuggest's input event trigger
    User has typed something new into the field
/*/ onInputChange (event, { newValue, method }) {
      // Pass the input value (node label search string) to UDATA
      // which will in turn pass the searchLabel back to the SEARCH
      // state handler in the constructor, which will in turn set the state
      // of the input value to be passed on to AutoSuggest
      this.Call('SOURCE_SEARCH', { searchString: newValue });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle Autosuggest's request to set the value of the input field when
    a selection is clicked.
/*/ getSuggestionValue (suggestion) {
      return suggestion.label;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle Autosuggest's request for HTML rendering of suggestions
/*/ renderSuggestion (suggestion) {
      return suggestion.label;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle Autosuggest's request for list of suggestions
    lexicon =  string array of node labels

    lexicon is a one-dimensional string array that represents the complete list
    of all possible suggestions that are then filtered based on the user typing
    for suggestions.

    We construct the list on the fly based on the D3DATA data.  If the data model
    changes, we'll need to update this lexicon constructor.
/*/ onSuggestionsFetchRequested () {
      let data = this.AppState('SEARCH');
      if (data.suggestedNodes) {
        this.setState({
          suggestions: (data.suggestedNodes)
        });
      } else {
        if (DBG) console.log('AutoComplete.onSuggestionsFetchRequested: No suggestions.');
      }
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle Autosuggest's request to clear list of suggestions
/*/ onSuggestionsClearRequested () {
      this.setState({
        suggestions: []
      });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Autosuggest's callback when a selection is made
    If a new value is suggested, we call SOURCE_SELECT.
    Autocomplete-logic should handle the creation of a new data object.
/*/ onSuggestionSelected (event, { suggestion }) {
      // User selected an existing node in the suggestion list
      this.Call('SOURCE_SELECT',{ nodeIDs: [suggestion.id] });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Autosuggest calls this whenever the user has highlighted a different suggestion
    from the suggestion list.
/*/ onSuggestionHighlighted ({ suggestion }) {
      if (suggestion && suggestion.id) this.Call('SOURCE_HILITE',{ nodeID: suggestion.id });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Autosuggest checks this before rendering suggestions
    Set the prop to turn off suggestions
/*/ shouldRenderSuggestions (value) {
      return this.state.mode===MODE_ACTIVE;
    }

/// REACT LIFECYCLE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ AutoComplete fields are routinely constructed and deconstructed as different
    edges and nodes are selected.  We need to keep track of whether it's
    mounted or not so that we know when it's valid to call setState.  Otherwise
    we might call setState on an unmounted component and generate a React warning.
    https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
/*/ componentDidMount () {
      _IsMounted = true;
      this.setState({ mode: this.props.inactiveMode })
    }
/*/
/*/ componentWillUnmount () {
      _IsMounted = false;
    }

/*/ Conditionally render components based on current 'mode'. The mode
    is passed
/*/ render () {
      const { value, suggestions } = this.state;
      const inputProps = {
        placeholder : "Type node name...",
        value       : value,
        onChange    : this.onInputChange
      };
      let jsx;
      switch (this.state.mode) {
        case MODE_STATIC:
          jsx = ( <p>{this.props.disabledValue}</p> );
          break;
        case MODE_DISABLED:
          jsx = ( <Input type="text" value={this.props.disabledValue} readOnly={true}/> );
          break;
        case MODE_ACTIVE:
          jsx = (
            <Autosuggest
              suggestions={suggestions}
              shouldRenderSuggestions={this.shouldRenderSuggestions}
              // Map to Local Handlers for Autosuggest event triggers (requests)
              onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
              onSuggestionsClearRequested={this.onSuggestionsClearRequested}
              getSuggestionValue={this.getSuggestionValue}
              renderSuggestion={this.renderSuggestion}
              // Receive Data from Autosuggest
              onSuggestionHighlighted={this.onSuggestionHighlighted}
              onSuggestionSelected={this.onSuggestionSelected}
              // Pass Data to Autosuggest
              inputProps={inputProps}
            />
          );
          break;
        default:
          throw Error(`AutoComplete: Unhandled mode '${this.state.mode}'`);
      }
      return jsx;
    } // render()

/// END OF CLASS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoComplete;



