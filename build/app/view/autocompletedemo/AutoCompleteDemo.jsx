/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const D3           = require('d3');
const AutoComplete = require('./components/AutoComplete');

/// React Component ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class AutoCompleteDemo extends React.Component {
  render() {
    return (
      <div>
        <div>The goal here is to try to develop an autocomplete component that 
        wraps the react-autosuggest component in a manner that is going to work
        well for Net.Create.</div>
        <AutoComplete />
      </div>
    );
  }
  componentDidMount () {
    console.log('D3',D3);
  }
}



/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoCompleteDemo;
