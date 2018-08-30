/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    ## OVERVIEW

       This provides a search field for looking up nodes.

       1. Users type in the field.
       2. The field will suggest matching nodes.
       3. User selects something from the suggestion list.
       4. The node will get loaded in NodeSelector.


    ## USAGE

      <Search/>

    ## TECHNICAL DESCRIPTION

       This provides a simple wrapper around AutoSuggest to handle
       messaging and data passing.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React          = require('react');
const ReactStrap     = require('reactstrap');
const { Col,
        FormGroup,
        Label }      = ReactStrap;
const AutoComplete   = require('./AutoComplete');

const UNISYS         = require('unisys/client');

const thisIdentifier = 'search';   // SELECTION identifier

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class Search extends UNISYS.Component {

    constructor (props) {
      super(props);
      this.state = {
        searchString:  ''
      };
      this.OnStart(()=>{
        // always wrap UNISYS calls in a lifescycle hook otherwise you may try to execute a call
        // before it has been declared in another module
        if (DBG) console.log('Search.OnStart: Setting active autocomplete id to',thisIdentifier);
        this.AppCall('AUTOCOMPLETE_SELECT',{id:thisIdentifier, value:this.state.searchString});
      });
    } // constructor



/// UI EVENT HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// REACT LIFECYCLE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentWillMount () {
    }
/*/ REACT calls this to receive the component layout and data sources
/*/ render () {
      return (
        <FormGroup row>
          <Col sm={3}>
            <Label className="small text-muted">Search</Label>
          </Col>
          <Col sm={9}>
            <AutoComplete
              identifier={thisIdentifier}
              disabledValue={this.state.searchString}
              inactiveMode={'disabled'}
            />
          </Col>
        </FormGroup>
      )
    }
} // class Search


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Search;
