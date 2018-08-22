/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    Help displays a hideable generic help screen.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Table }    = ReactStrap;

const UNISYS   = require('unisys/client');


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class Help extends UNISYS.Component {
    constructor (props) {
      super(props);
      this.state = {isExpanded: false};
      this.onToggleExpanded         = this.onToggleExpanded.bind(this);
    } // constructor



/// UI EVENT HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onToggleExpanded (event) {
      this.setState({
        isExpanded: !this.state.isExpanded
      })
    }



/// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This is not yet implemented as of React 16.2.  It's implemented in 16.3.
    getDerivedStateFromProps (props, state) {
      console.error('getDerivedStateFromProps!!!');
    }
/*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ render () {
      return (
        <div className="help"
             style={{maxHeight:'50vh',overflow:'scroll',float:'right'}}>
          <Button size="sm" outline
            style={{float:'right'}}
            onClick={this.onToggleExpanded}
          >{this.state.isExpanded ? "Hide Help" : "Help"}</Button>
          <div hidden={!this.state.isExpanded}
            style={{backgroundColor:'#eee',padding:'10px'}}>
            <h1>Navigation</h1>
            <ul>
              <li>Zoom -- mousewheel or two fingers up/down on trackpad</li>
              <li>Pan -- drag empty space</li>
            </ul>
            <h1>Nodes</h1>
            <ul>
              <li>Select -- Click on a node, or start typing the node label in
              the Label field and select a node from the suggestions.</li>
            </ul>
            <h1>Edges</h1>
            <ul>
              <li>Editing -- To change the source or target of an existing edge,
              delete it and create a new one.</li>
            </ul>
          </div>
        </div>
      );
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentDidMount () {
      if (DBG) console.log('Help.componentDidMount!');
    }
} // class Help


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Help;
