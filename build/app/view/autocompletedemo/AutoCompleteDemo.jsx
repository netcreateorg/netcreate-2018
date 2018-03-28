/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const d3           = require('d3');
const AutoComplete = require('./components/AutoComplete');

/// React Component ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*
    lexicon is a one-dimensional string array that represents the complete list 
    of all possible suggestions that are then filtered based on the user typing
    for suggestions.
*/


/// export a class object for consumption by brunch/require
class AutoCompleteDemo extends React.Component {
  constructor () {
    super();
    this.state = { lexicon: [] };
    this.handleJSONLoad = this.handleJSONLoad.bind(this);
  }
  handleJSONLoad ( error, _data ) {
    if (error) throw error;
    // map nodes[].label to textList
    this.setState( {lexicon: _data.nodes.map(function(d){return d.label;})} );
  }
  componentDidMount () {
    console.log('D3',d3);
    // Load Data
    // This loads data from the htmldemos/d3forcedemo data file for now.
    // Relative URLS don't seem to work.
    // The URL is constructed in http://localhost:3000/scripts/node_modules/url/url.js line 110.
    d3.json("http://localhost:3000/htmldemos/d3forcedemo/data.json", this.handleJSONLoad);
  }
  render() {
    return (
      <div>
        <h1>Auto Complete Demo</h1>
        <p>The goal here is to try to develop an autocomplete component that 
        wraps the react-autosuggest component in a manner that is going to work
        well for Net.Create.</p>
        <AutoComplete lexicon={this.state.lexicon}/>
      </div>
    );
  }
}



/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoCompleteDemo;
