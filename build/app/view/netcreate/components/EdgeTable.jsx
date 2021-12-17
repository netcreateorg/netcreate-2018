/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    EdgeTable is used to to display a table of edges for review.

    It displays D3DATA.
    But also read FILTEREDD3DATA to show highlight/filtered state


  ## TO USE

    EdgeTable is self contained and relies on global D3DATA to load.

      <EdgeTable/>


    Set `DBG` to true to show the `ID` column.

  ## 2018-12-07 Update

    Since we're not using tab navigation:
    1. The table isExpanded is now true by default.
    2. The "Show/Hide Table" button is hidden.

    Reset these to restore previous behavior.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


var DBG = false;

const SETTINGS     = require('settings');
const isLocalHost  = (SETTINGS.EJSProp('client').ip === '127.0.0.1') || (location.href.includes('admin=true'));

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Table }    = ReactStrap;
const MarkdownNote = require('./MarkdownNote');

const UNISYS   = require('unisys/client');
var   UDATA    = null;


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class EdgeTable extends UNISYS.Component {
    constructor (props) {
      super(props);

      this.state = {
        edgePrompts:  this.AppState('TEMPLATE').edgePrompts,
        edges:        [],
        filteredEdges: [],
        isExpanded:   true,
        sortkey:      'Relationship'
      };

      this.updateEdgeFilterState = this.updateEdgeFilterState.bind(this);
      this.handleDataUpdate = this.handleDataUpdate.bind(this);
      this.handleFilterDataUpdate = this.handleFilterDataUpdate.bind(this);
      this.OnTemplateUpdate = this.OnTemplateUpdate.bind(this);
      this.onButtonClick            = this.onButtonClick.bind(this);
      this.onToggleExpanded         = this.onToggleExpanded.bind(this);
      this.m_FindMatchingObjsByProp = this.m_FindMatchingObjsByProp.bind(this);
      this.m_FindMatchingEdgeByProp = this.m_FindMatchingEdgeByProp.bind(this);
      this.m_FindEdgeById           = this.m_FindEdgeById.bind(this);
      this.setSortKey               = this.setSortKey.bind(this);
      this.sortSymbol               = this.sortSymbol.bind(this);

      this.sortDirection = 1;


      /// Initialize UNISYS DATA LINK for REACT
      UDATA = UNISYS.NewDataLink(this);

      // Always make sure class methods are bind()'d before using them
      // as a handler, otherwise object context is lost
      this.OnAppStateChange('D3DATA', this.handleDataUpdate);

      // Handle Template updates
      this.OnAppStateChange('TEMPLATE', this.OnTemplateUpdate);

      // Track Filtered Data Updates too
      this.OnAppStateChange('FILTEREDD3DATA', this.handleFilterDataUpdate);

  } // constructor

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentDidMount () {
      if (DBG) console.log('EdgeTable.componentDidMount!');
      // Explicitly retrieve data because we may not have gotten a D3DATA
      // update while we were hidden.
      // filtered data needs to be set before D3Data
      const FILTEREDD3DATA = UDATA.AppState('FILTEREDD3DATA');
      this.setState({ filteredEdges: FILTEREDD3DATA.edges },
        () => {
          let D3DATA = this.AppState('D3DATA');
          this.handleDataUpdate(D3DATA);
        }
      )
}

    componentWillUnmount() {
      this.AppStateChangeOff('D3DATA', this.handleDataUpdate);
      this.AppStateChangeOff('FILTEREDD3DATA', this.handleFilterDataUpdate);
      this.AppStateChangeOff('TEMPLATE', this.OnTemplateUpdate);
    }

  displayUpdated(nodeEdge) {
      var d = new Date(nodeEdge.meta.revision > 0 ? nodeEdge.meta.updated : nodeEdge.meta.created);

      var year = "" + d.getFullYear();
      var date = (d.getMonth()+1)+"/"+d.getDate()+"/"+ year.substr(2,4);
      var time = d.toTimeString().substr(0,5);
      var dateTime = date+' at '+time;
      var titleString = "v" + nodeEdge.meta.revision;
      if(nodeEdge._nlog)
        titleString += " by " + nodeEdge._nlog[nodeEdge._nlog.length-1];
      var tag = <span title={titleString}> {dateTime} </span>;

      return tag;
  }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Set edge filtered status based on current filteredNodes
  updateEdgeFilterState(edges, filteredEdges) {
    // add highlight/filter status
    if (filteredEdges.length > 0) {
      edges = edges.map(edge => {
        const filteredEdge = filteredEdges.find(n => n.id === edge.id);
        edge.isFiltered = !filteredEdge;
        return edge;
      });
    }
    this.setState({edges});
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Handle updated SELECTION
  /*/
  handleDataUpdate(data) {
    if (data && data.edges) {
      const edges = this.sortTable(this.state.sortkey, data.edges);
      const { filteredEdges } = this.state;
      this.updateEdgeFilterState(edges, filteredEdges);
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  handleFilterDataUpdate(data) {
    if (data.edges) {
      const filteredEdges = data.edges;
      this.setState({ filteredEdges }, () => {
        const edges = this.sortTable(this.state.sortkey, this.state.edges);
        this.updateEdgeFilterState(edges, filteredEdges);
      });
    }
  }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  OnTemplateUpdate(data) {
    this.setState({edgePrompts: data.edgePrompts});
  }


/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortByID (edges) {
      if (edges) {
        return edges.sort( (a,b) => {
          let akey = a.id,
              bkey = b.id;
          if (akey<bkey) return -1*this.sortDirection;
          if (akey>bkey) return 1*this.sortDirection;
          return 0;
        });
      }
      return undefined;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortBySourceLabel (edges) {
      if (edges) {
        return edges.sort( (a,b) => {
          let akey = a.source.label,
              bkey = b.source.label;
          return (akey.localeCompare(bkey)*this.sortDirection);
        });
      }
      return undefined;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortByTargetLabel (edges) {
      if (edges) {
        return edges.sort( (a,b) => {
          let akey = a.target.label,
              bkey = b.target.label;

          return (akey.localeCompare(bkey)*this.sortDirection);

        });
      }
      return undefined;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortByAttribute (edges, key) {
      if (edges) {
        return edges.sort( (a,b) => {
          let akey = a.attributes[key],
              bkey = b.attributes[key];
          if (akey<bkey) return -1*this.sortDirection;
          if (akey>bkey) return 1*this.sortDirection;
          if (akey===bkey) {
            // Secondary sort on Source label
            let source_a = a.source.label;
            let source_b = b.source.label;
            if (source_a<source_b) return -1*this.sortDirection;
            if (source_a>source_b) return 1*this.sortDirection;
          }
          return 0;
        });
      }
      return undefined;
    }

    /// ---
    sortByUpdated(edges)
    {
      if (edges) {
        return edges.sort( (a,b) => {
          let akey = (a.meta.revision > 0 ? a.meta.updated : a.meta.created),
              bkey = (b.meta.revision > 0 ? b.meta.updated : b.meta.created);
          if (akey<bkey) return -1*this.sortDirection;
          if (akey>bkey) return 1*this.sortDirection;
          return 0;
        });
      }
      return undefined;

    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ If no `sortkey` is passed, the sort will use the existing state.sortkey
/*/ sortTable ( sortkey=this.state.sortkey, edges) {
      switch (sortkey) {
        case 'id':
          return this.sortByID(edges);
          break;
        case 'source':
          return this.sortBySourceLabel(edges);
          break;
        case 'target':
          return this.sortByTargetLabel(edges);
          break;
        case 'Relationship':
          return this.sortByAttribute(edges, 'Relationship');
          break;
        case 'Info':
          return this.sortByAttribute(edges, 'Info');
          break;
        case 'Notes':
          return this.sortByAttribute(edges, 'Notes');
          break;
        case 'Category':
          return this.sortByAttribute(edges, 'Category');
          break;
        case 'Citations':
          return this.sortByAttribute(edges, 'Citations');
          break;
        case 'Updated':
          return this.sortByUpdated(edges);
          break;
        case 'Relationship':
        default:
          return this.sortByAttribute(edges, 'Relationship');
          break;
      }
    }

    sortSymbol(key)
    {
      if(key != this.state.sortkey) // this is not the current sort, so don't show anything
        return "";
      else
        return this.sortDirection==1?"▼":"▲"; // default to "decreasing" and flip if clicked again
    }

/// UI EVENT HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onButtonClick (event) {
      event.preventDefault();

      let edgeID = parseInt( event.target.value );
      let edge = this.m_FindEdgeById( edgeID );

      if (DBG) console.log('EdgeTable: Edge id',edge.id,'selected for editing');

      // Load Source then Edge
      UDATA.LocalCall('SOURCE_SELECT',{ nodeIDs: [edge.source.id] })
      .then(()=>{
        UDATA.LocalCall('EDGE_EDIT',{ edgeID: edge.id });
      });

    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onToggleExpanded (event) {
      this.setState({
        isExpanded: !this.state.isExpanded
      })
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ setSortKey (key) {

      if(key == this.state.sortkey)
        this.sortDirection = (-1 * this.sortDirection);// if this was already the key, flip the direction
      else
          this.sortDirection = 1;

      const edges = this.sortTable(key, this.state.edges);
      this.setState({
        edges,
        sortkey: key
      });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ selectNode (id, event) {
      event.preventDefault();

      // Load Source
      if (DBG) console.log('EdgeTable: Edge id',id,'selected for editing');
      UDATA.LocalCall('SOURCE_SELECT',{ nodeIDs: [id] });
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
      let { edgePrompts } = this.state;

      if(edgePrompts.category == undefined) // for backwards compatability
      {
        edgePrompts.category = {};
        edgePrompts.category.label = "";
        edgePrompts.category.hidden = true;
      }

      const { tableHeight } = this.props;
      const styles = `thead, tbody { font-size: 0.8em }
                    thead { position: relative; }
                    tbody { overflow: auto; }
                    .btn-sm { font-size: 0.6rem; padding: 0.1rem 0.2rem }
                    `
      return (
           <div style={{overflow:'auto',
                     position:'relative',display: 'block',  left: '1px', right:'10px',maxHeight: tableHeight, backgroundColor:'#f3f3ff'
             }}>
          <style>{styles}</style>
          <Button size="sm" outline hidden
            onClick={this.onToggleExpanded}
          >{this.state.isExpanded ? "Hide Edge Table" : "Show Edge Table"}</Button>
          <Table hidden={!this.state.isExpanded} hover size="sm"
                 responsive striped
                 className="edgetable w-auto"
          >
            <thead>
              <tr>
                <th width="4%" hidden={!DBG}><Button size="sm"
                      onClick={()=>this.setSortKey("id")}
                    >ID {this.sortSymbol("id")}</Button></th>
                <th hidden={!DBG}>Size</th>
                <th width="4%"><div style={{color: '#f3f3ff'}}>_Edit_</div></th>
                <th hidden={!DBG}>Src ID</th>
                <th  width="10%"><Button size="sm"
                      onClick={()=>this.setSortKey("source")}
                    >{edgePrompts.source.label} {this.sortSymbol("source")}</Button></th>
                <th width="10%"><Button size="sm"
                      onClick={()=>this.setSortKey("Relationship")}
                    >{edgePrompts.type.label} {this.sortSymbol("Relationship")}</Button></th>
                <th hidden={!DBG}>Target ID</th>
                <th width="10%"><Button size="sm"
                      onClick={()=>this.setSortKey("target")}
                    >{edgePrompts.target.label} {this.sortSymbol("target")}</Button></th>
                <th width="8%" hidden={edgePrompts.category.hidden}><Button size="sm"
                      onClick={()=>this.setSortKey("Category")}
                    >{edgePrompts.category.label} {this.sortSymbol("Category")}</Button></th>
                <th width="10%" hidden={edgePrompts.citation.hidden}><Button size="sm"
                      onClick={()=>this.setSortKey("Citations")}
                    >{edgePrompts.citation.label} {this.sortSymbol("Citations")}</Button></th>
                <th width="20%" hidden={edgePrompts.notes.hidden}><Button size="sm"
                      onClick={()=>this.setSortKey("Notes")}
                    >{edgePrompts.notes.label} {this.sortSymbol("Notes")}</Button></th>
                <th  width="10%"hidden={edgePrompts.info.hidden}><Button size="sm"
                      onClick={()=>this.setSortKey("Info")}
                    >{edgePrompts.info.label} {this.sortSymbol("Info")}</Button></th>
                <th  width="10%"hidden={!isLocalHost}><Button size="sm"
                      onClick={()=>this.setSortKey("Updated")}
                    >Updated {this.sortSymbol("Updated")}</Button></th>

              </tr>
            </thead>
            <tbody style={{ maxHeight: tableHeight }}>
            {this.state.edges.map( (edge,i) => (
              <tr key={i}
                style={{
                  color: edge.isFiltered ? 'red' : 'black',
                  opacity: edge.filteredTransparency
                }}>
                <td hidden={!DBG}>{edge.id}</td>
                <td hidden={!DBG}>{edge.size}</td>
                <td><Button size="sm" outline
                      value={edge.id}
                      onClick={this.onButtonClick}
                    >Edit</Button>
                </td>
                <td hidden={!DBG}>{edge.source.id}</td>
                <td><a href="#" onClick={(e)=>this.selectNode(edge.source.id,e)}
                    >{edge.source.label || edge.source}</a></td>
                <td>{edge.attributes["Relationship"]}</td>
                <td hidden={!DBG}>{edge.target.id}</td>
                <td><a href="#" onClick={(e)=>this.selectNode(edge.target.id,e)}
                    >{edge.target.label || edge.target}</a></td>
                <td hidden={edgePrompts.category.hidden}>{edge.attributes["Category"]}</td>
                <td hidden={edgePrompts.citation.hidden}>{edge.attributes["Citations"]}</td>
                <td hidden={edgePrompts.notes.hidden}>
                  {edge.attributes["Notes"] ? <MarkdownNote text={edge.attributes["Notes"]} /> : "" }
                </td>
                <td hidden={edgePrompts.info.hidden}>{edge.attributes["Info"]}</td>
                <td hidden={!isLocalHost}>{this.displayUpdated(edge)}</td>
              </tr>
            ))}
            </tbody>
          </Table>
        </div>
      );
    }
} // class EdgeTable


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeTable;
