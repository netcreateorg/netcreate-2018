/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    EdgeList is used to to display a table of edges for review.


  ## TO USE

    EdgeList are usually included as a repeating element, e.g.

      <FormText>EDGES</FormText>
      {this.state.edges.map( (edge,i) =>
        <EdgeEditor key={i}
          edgeID={edge.id}
          parentNodeLabel={this.state.formData.label}
        />
      )}



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Table }    = ReactStrap;

const UNISYS   = require('unisys/client');
var   UDATA    = null;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class EdgeList extends UNISYS.Component {
    constructor (props) {
      super(props);

      this.state = {
        edges:      [],
        isExapnded: false
      };

      this.onButtonClick            = this.onButtonClick.bind(this);
      this.onToggleExpanded         = this.onToggleExpanded.bind(this);
      this.m_FindMatchingObjsByProp = this.m_FindMatchingObjsByProp.bind(this);
      this.m_FindMatchingEdgeByProp = this.m_FindMatchingEdgeByProp.bind(this);
      this.m_FindEdgeById           = this.m_FindEdgeById.bind(this);


      /// Initialize UNISYS DATA LINK for REACT
      UDATA = UNISYS.NewDataLink(this);

      // Always make sure class methods are bind()'d before using them
      // as a handler, otherwise object context is lost
      this.OnAppStateChange('D3DATA',(data) => {
        this.handleDataUpdate(data);
      });
    } // constructor



/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle updated SELECTION
/*/ handleDataUpdate ( data ) {
      this.setState({edges: data.edges});
      if (DBG) console.error('EdgeList.handleDataUpdate',data);
    }


/// UI EVENT HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onButtonClick (event) {
      event.preventDefault();

      let edgeID = event.target.value;
      let edge = this.m_FindEdgeById( edgeID );

      console.log('EdgeList: Edge id',edge.id,'selected for editing');

      // Load Source
      UDATA.Call('SOURCE_SELECT',{ nodeLabels: [edge.source.label] });

      // HACK
      // We need to wait for the source node to get selected and activated
      // first before we try to open the edge
      // This should probably be a callback?
      setTimeout( () => {
        // Load Target as Edge
        UDATA.Call('EDGE_SELECT',{ edgeID: edge.id });
      }, 500)


    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onToggleExpanded (event) {
      this.setState({
        isExpanded: !this.state.isExpanded
      })
    }

/// OBJECT HELPERS ////////////////////////////////////////////////////////////
/// these probably should go into a utility class
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of objects that match the match_me object keys/values
    NOTE: make sure that strings are compared with strings, etc
/*/ m_FindMatchingObjsByProp( obj_list, match_me={} ) {
      // operate on arrays only
      if (!Array.isArray(obj_list)) throw Error("FindMatchingObjectsByProp arg1 must be array");
      let matches = obj_list.filter( obj => {
        let pass = true;
        for (let key in match_me) {
          if (match_me[key]!==obj[key]) pass=false; break;
        }
        return pass;
      });
      // return array of matches (can be empty array)
      return matches;
    }

/// EDGE HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of nodes that match the match_me object keys/values
    NOTE: make sure that strings are compared with strings, etc
/*/ m_FindMatchingEdgeByProp( match_me={} ) {
      return this.m_FindMatchingObjsByProp(this.state.edges,match_me);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Convenience function to retrieve edge by ID
/*/ m_FindEdgeById( id ) {
      return this.m_FindMatchingEdgeByProp({ id })[0];
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
        <div style={{maxHeight:'50vh',overflow:'scroll'}}>
          <Button size="sm" outline
            onClick={this.onToggleExpanded}
          >{this.state.isExpanded ? "Hide Edge Table" : "Show Edge Table"}</Button>
          <Table hidden={!this.state.isExpanded} hover size="sm">
            <thead>
              <tr>
                <th>ID</th>
                <th></th>
                <th>Source</th>
                <th>Target</th>
                <th>Type</th>
                <th>Citation</th>
                <th>Notes</th>
                <th>Info</th>
              </tr>
            </thead>
            <tbody>
            {this.state.edges.map( (edge,i) =>
              <tr key={i}>
                <td>{edge.id}</td>
                <td><Button size="sm" outline
                      value={edge.id}
                      onClick={this.onButtonClick}
                    >Edit</Button>
                </td>
                <td>{edge.source.label || edge.source}</td>
                <td>{edge.target.label || edge.target}</td>
                <td>{edge.attributes["Relationship"]}</td>
                <td>{edge.attributes["Citations"]}</td>
                <td>{edge.attributes["Notes"]}</td>
                <td>{edge.attributes["Info"]}</td>
              </tr>
            )}
            </tbody>
          </Table>
        </div>
      );
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentDidMount () {
      if (DBG) console.log('EdgeList.componentDidMount!');
    }
} // class EdgeList



          // {this.state.edges.map( (edge,i) => {
          //   console.log('working on ',edge);
          //   let td=[];
          //   td.push(<td key={'id'+i}>{edge.id}</td>);
          //   td.push(<td key={'target'+i}>{edge.attributes.Citations}</td>);
          //   return <tr key={i}>{td}</tr>
          //   }
          // )}



/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeList;
