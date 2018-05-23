const React       = require('react');
const d3          = require('d3');
const Autosuggest = require('react-autosuggest');

//////////// AUTO COMPLETE ////////////
/******************************************************************************/
/*/

      AutoComplete is the text input field for entering node labels to:
      * search for nodes,
      * edit existing nodes,
      * and add new nodes.

      Main features:

      * It interactively provides a list of suggestions that match the current
        input, e.g. typing "ah" will display a list of suggestions including "Ah
        Long", "Ah Seung", and "Oahu Railroad Station".

      * Users can highlight suggestions (via mouseover or with keyboard arrows)

      * Users can select a suggestion (via clicking or hitting return)

      AutoComplete is a wrapper class for the open source AutoSuggest component,
      which handles the actual rendering of the suggestions list.  AutoComplete
      provides an interface to NodeSelector and EdgeEntry.  AutoComplete also
      provides the handler routines for generating the suggestions list and
      handling highlights and selections.



      This relies on the react-autosuggest component.
      See documentation:  https://github.com/moroshko/react-autosuggest


      To Use:
          <AutoComplete

            data={this.state.data}
            value={label}
            disableSuggestions={this.state.canEdit}

            onInputChange={this.handleInputChange}
            onSelection={this.handleNodeSelection}
            onHighlight={this.handleSuggestionHighlight}
          />



      INPUTS

      data is mapped to this.props.data
            This is how graph data is passed to the AutoComplete component.

      value is mapped to this.props.setValue
            Use this to set the autocomplete value externally.

      disableSuggesions is mapped to this.props.disabled
            Set to true to stop making suggestions


      HANDLERS

      onInputChange is mapped to this.props.onInputChange.
            It is triggered by AutoComplete whenever the user types into
            the AutoComplete input field.
            It is used to pass the current state of the user input
            filed to the parent components.

      onSelection is mapped to this.props.onSelection.
            It is triggered by AutoComplete whenenever the users
            selects an item from the suggestions list by clicking on it.
            It is used to pass the selected label to the parent component.

      onHighlight is mapped to this.props.onHighlight
            It is triggered by AutoComplete whenever the user
            highlights an item from the suggestion list by either moving
            the mouse over it, or using keyboard to select it.
            This is a temporary state and is cleared when onSelection is
            triggered.

      Based on example code from https://codepen.io/moroshko/pen/vpBzMr

/*/


// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
const escapeRegexCharacters = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSuggestions = (value, lexicon) => {
  const escapedValue = escapeRegexCharacters(value.trim());

  if (escapedValue === '') {
    return [];
  }

    // const regex = new RegExp('^' + escapedValue, 'i'); // match start of string only
    const regex = new RegExp(escapedValue, 'i');
    const suggestions = lexicon.filter(phrase => regex.test(phrase));

  if (suggestions.length === 0) {
    return [
      { isAddNew: true }
    ];
  }
  // console.log(suggestions);
  return suggestions;
};





/// React Component ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class AutoComplete extends React.Component {
  constructor() {
    super();
    this.state = {
      value: '',
      suggestions: []
    };

    this.onChange                    = this.onChange.bind(this);
    this.getSuggestionValue          = this.getSuggestionValue.bind(this);
    this.renderSuggestion            = this.renderSuggestion.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    this.onSuggestionSelected        = this.onSuggestionSelected.bind(this);
    this.onSuggestionHighlighted     = this.onSuggestionHighlighted.bind(this);
    this.shouldRenderSuggestions     = this.shouldRenderSuggestions.bind(this);
  };

  onChange (event, { newValue, method }) {
    this.setState({
      value: newValue
    });
    this.props.onInputChange( newValue )
  };

  getSuggestionValue (suggestion) {
    if (suggestion.isAddNew) {
      return this.state.value;
    }

    return suggestion;
  };

  renderSuggestion (suggestion) {
    if (suggestion.isAddNew) {
      // Don't show "Add New" because when you're adding a new item that partially
      // matches an existing item, you'll have a list of suggestions.  Better to
      // have the user always click "Add New Node" button.
      //
      // return (
      //   <span>
      //     [+] Add new: <strong>{this.state.value}</strong>
      //   </span>
      // );
      //
      // Instead, just show a blank
      return (<span></span>);
    }

    return suggestion;
  };

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Handle Autosuggest's request for list of suggestions
  /*/
      lexicon =  string array of node labels

      lexicon is a one-dimensional string array that represents the complete list
      of all possible suggestions that are then filtered based on the user typing
      for suggestions.

      We construct the list on the fly based on the d3 data.  If the data model
      changes, we'll need to update this lexicon constructor.
  /*/
  onSuggestionsFetchRequested ({ value }) {
    let lexicon = this.props.data.nodes.map(function(d){return d.label})
    this.setState({
      suggestions: getSuggestions(value, lexicon)
    });
  };

  // Handle Autosuggest's request to clear list of suggestions
  onSuggestionsClearRequested () {
    this.setState({
      suggestions: []
    });
  };

/// If a new value is suggested, we pass that up to the parent.
/// The parent component should handle the creation of a new data object.
  onSuggestionSelected (event, { suggestion }) {
    // call parent handler
    if (suggestion.isAddNew) {
      // console.log('Add new:', this.state.value, 'suggestion',suggestion);
      this.props.onSelection( this.state.value )
    } else {
      this.props.onSelection( suggestion )
    }
  };

  onSuggestionHighlighted ({ suggestion }) {
    this.props.onHighlight( suggestion )
  };

  shouldRenderSuggestions (value) {
    return this.props.disableSuggestions
  }

  setValue ( value ) {
    // console.log('...AutoComplete.setValue to',value)
    this.setState({value: value})
  }
  clearValue () {
    this.setState({value:''})
  }

  componentWillReceiveProps (nextProps) {
    // console.log('AutoComplete: componentWillReceiveProps',nextProps)
    if (nextProps.value!==undefined) this.setValue( nextProps.value )
  }

  render() {
    const { value, suggestions } = this.state;
    const inputProps = {
      placeholder: "Type node name...",
      value,
      onChange: this.onChange
    };

    return (
    /*STYLE*/// this passing of handlers down the chain is exactly what we'd like to avoid, right?
            /// it makes wiring components together very cumbersome when writing new code
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
  }
}


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoComplete;



