/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    Help displays a hideable generic help screen.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;
var UDATA = null;

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
      this.state = {isExpanded: true};
      this.onToggleExpanded = this.onToggleExpanded.bind(this);
      this.onSelectExport = this.onSelectExport.bind(this);

      UDATA = UNISYS.NewDataLink(this);
    } // constructor



/// UI EVENT HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onToggleExpanded (event) {
      this.setState({
        isExpanded: !this.state.isExpanded
      })
}

  onSelectExport() {
    UDATA.LocalCall('EXPORT');
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
             style={{maxWidth:'50%',overflow:'scroll',
                     position:'fixed',right:'10px',zIndex:2000
             }}>
          <Button size="sm" outline hidden
            style={{float:'right'}}
            onClick={this.onToggleExpanded}
          >{this.state.isExpanded ? "Hide Help" : "Help"}</Button>
          <div hidden={!this.state.isExpanded}
            style={{backgroundColor:'rgba(240,240,240,0.95)',padding:'10px'}}>
            <Button size="sm" outline onClick={this.onSelectExport}>
              Export Data
            </Button>
            <hr />
            <h1>Why Net.Create</h1>
            <p>In Net.Create, users can simultaneously do data entry on nodes and the edges between them.</p>
            <h1>Navigation</h1>
            <ul>
              <li>Recenter the graph -- press the * button</li>
              <li>Zoom --
                <ul>
                  <li>on screen -- use the +/- buttons</li>
                  <li>mouse -- use mousewheel</li>
                  <li>trackpad -- two fingers up/down</li>
                  <li>tablet -- two fingers pinch</li>
                </ul>
              </li>
              <li>Pan -- drag empty space</li>
            </ul>
            <h1>Nodes</h1>
            <ul>
              <li>Select -- Click on a node, or start typing the node label in
              the Label field and select a node from the suggestions.</li>
            </ul>
            <h1>Edges</h1>
            <ul>
              <li>Create -- To create an edge, first select the source node, then
              click "Add New Edge".</li>
              <li>Select -- To select an edge, select either of the nodes it is attached to.</li>
              <li>Editing -- To change the source or target of an existing edge,
              delete it and create a new one.</li>
              <li>View Full List -- Click on "Show Edge Table" to view a table
              of all the edges.  Click on a column header to sort the table by
              that parameter.</li>
            </ul>
            <h1>About Net.Create</h1>
            <p>Net.Create is funded through the <a href="https://www.nsf.gov/pubs/policydocs/pappguide/nsf09_1/gpg_2.jsp#IID2" target="NSF">EAGER program</a> at <a href="https://www.nsf.gov/" target="NSF">NSF</a> under award #<a href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=1848655" target="NSF">1848655</a>. <a href="http://www.kalanicraig.com" target="Craig">Kalani Craig</a> is the PI, with Co-PIs <a href="http://www.joshuadanish.com" target="Danish">Joshua Danish</a> and <a href="https://education.indiana.edu/about/directory/profiles/hmelo-silver-cindy.html" target="Hmelo-Silver">Cindy Hmelo-Silver</a>. Software development provided by <a href="http://inquirium.net" target="Inquirium">Inquirium</a>. For more information, see <a href="http://netcreate.org" target="NetCreateOrg">Net.Create.org</a></p>

          </div>
        </div>
      );
    }

} // class Help


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Help;
