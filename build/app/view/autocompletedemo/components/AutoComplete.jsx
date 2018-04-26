const React       = require('react');
const d3          = require('d3');
const Autosuggest = require('react-autosuggest');
const ReactStrap = require('reactstrap')
const { FormText } = ReactStrap

//////////// AUTO SUGGEST ////////////
/******************************************************************************/
// 
// Example code from https://codepen.io/moroshko/pen/vpBzMr
//
//
//
// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
const escapeRegexCharacters = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSuggestions = (value, lexicon) => {
  const escapedValue = escapeRegexCharacters(value.trim());
  
  if (escapedValue === '') {
    return [];
  }

  const regex = new RegExp('^' + escapedValue, 'i');
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
      return (
        <span>
          [+] Add new: <strong>{this.state.value}</strong>
        </span>
      );
    }

    return suggestion;
  };
  
  onSuggestionsFetchRequested ({ value }) {
    this.setState({
      suggestions: getSuggestions(value, this.props.lexicon)
    });
  };

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
      console.log('Add new:', this.state.value, 'suggestion',suggestion);
      this.props.onSelection( this.state.value )
    } else {
      this.props.onSelection( suggestion )
    }
  };

  onSuggestionHighlighted ({ suggestion }) {
    if (suggestion!==null) this.props.onSelection( suggestion )
  };

  render() {
    const { value, suggestions } = this.state;
    const inputProps = {
      placeholder: "Type node name...",
      value,
      onChange: this.onChange
    };

    return (
      <div style={{minHeight:'100px',backgroundColor:'#c7f1f1',padding:'5px',marginBottom:'10px'}}>
        <FormText>SEARCH</FormText>
        <hr/>
        <Autosuggest 
          suggestions={suggestions}
          // Link to Local Handlers for internal Autosuggest functions
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          // Receive Data from Autosuggest
          onSuggestionSelected={this.onSuggestionSelected}
          onSuggestionHighlighted={this.onSuggestionHighlighted}
          // Pass Data to Autosuggest
          inputProps={inputProps} 
        />
      </div>
    );
  }
}


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoComplete;



