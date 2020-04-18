/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    EdgeTable is used to to display a table of edges for review.


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

// MD React stuff added bt Joshua ... probably could be placed better
import MDReactComponent from 'markdown-react-js';
const mdplugins = {
  emoji: require('markdown-it-emoji')
};

var DBG = false;

const SETTINGS     = require('settings');
const isLocalHost  = (SETTINGS.EJSProp('client').ip === '127.0.0.1') || (location.href.includes('admin=true'));

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
class EdgeTable extends UNISYS.Component {
    constructor (props) {
      super(props);

      this.state = {
        edgePrompts:  this.AppState('TEMPLATE').edgePrompts,
        edges:        [],
        isExpanded:   true,
        sortkey:      'Relationship'
      };

      this.onButtonClick            = this.onButtonClick.bind(this);
      this.onToggleExpanded         = this.onToggleExpanded.bind(this);
      this.m_FindMatchingObjsByProp = this.m_FindMatchingObjsByProp.bind(this);
      this.m_FindMatchingEdgeByProp = this.m_FindMatchingEdgeByProp.bind(this);
      this.m_FindEdgeById           = this.m_FindEdgeById.bind(this);
      this.setSortKey               = this.setSortKey.bind(this);
      this.sortSymbol               = this.sortSymbol.bind(this);

      var sortDirection = -1;


      /// Initialize UNISYS DATA LINK for REACT
      UDATA = UNISYS.NewDataLink(this);

      // Always make sure class methods are bind()'d before using them
      // as a handler, otherwise object context is lost
      this.OnAppStateChange('D3DATA',(data) => {
        this.handleDataUpdate(data);
      });

      // Handle Template updates
      this.OnAppStateChange('TEMPLATE',(data) => {
        this.setState({edgePrompts: data.edgePrompts});
      });
    } // constructor



/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle updated SELECTION
/*/ handleDataUpdate ( data ) {
      if(data.bMarkedNode)
      {
          data.bMarkedNode = false;
      }
      else
      {
        if (data && data.edges) {
        this.setState({edges: data.edges});
        this.sortTable();
      }
    }
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
/*/ sortTable ( sortkey=this.state.sortkey) {
      let edges = this.state.edges;
      switch (sortkey) {
        case 'id':
          this.sortByID(edges);
          break;
        case 'source':
          this.sortBySourceLabel(edges);
          break;
        case 'target':
          this.sortByTargetLabel(edges);
          break;
        case 'Relationship':
          this.sortByAttribute(edges, 'Relationship');
          break;
        case 'Info':
          this.sortByAttribute(edges, 'Info');
          break;
        case 'Notes':
          this.sortByAttribute(edges, 'Notes');
          break;
        case 'Category':
          this.sortByAttribute(edges, 'Category');
          break;
        case 'Citations':
          this.sortByAttribute(edges, 'Citations');
          break;
        case 'Updated':
          this.sortByUpdated(edges);
          break;
        case 'Relationship':
        default:
          this.sortByAttribute(edges, 'Relationship');
          break;
      }
      this.setState({edges});
    }

    sortSymbol(key)
    {
      if(key != this.state.sortkey) // this is not the current sort, so don't show anything
        return "";
      else
        return this.sortDirection==-1?"▼":"▲"; // default to "decreasing" and flip if clicked again
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

      this.setState({sortkey: key});
      this.sortTable(key);
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


      let { tableHeight } = this.props;
      let styles = `
                    thead, tbody { }
                    thead { position: relative; }
                    tbody { overflow: auto; }
`
      return (
           <div style={{overflow:'auto',
                     position:'relative',display: 'block', right:'10px',maxHeight: tableHeight, backgroundColor:'#f3f3ff'
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
                <th width="5%" hidden={!DBG}><Button size="sm"
                      onClick={()=>this.setSortKey("id")}
                    >ID {this.sortSymbol("id")}</Button></th>
                <th hidden={!DBG}>Size</th>
                <th width="5%"><div style={{color: '#f3f3ff'}}>_Edit_</div></th>
                <th  width="10%"><Button size="sm"
                      onClick={()=>this.setSortKey("source")}
                    >{edgePrompts.source.label} {this.sortSymbol("source")}</Button></th>
                <th width="10%"><Button size="sm"
                      onClick={()=>this.setSortKey("Relationship")}
                    >{edgePrompts.type.label} {this.sortSymbol("Relationship")}</Button></th>
                <th width="10%"><Button size="sm"
                      onClick={()=>this.setSortKey("target")}
                    >{edgePrompts.target.label} {this.sortSymbol("target")}</Button></th>
                <th width="5%" hidden={edgePrompts.category.hidden}><Button size="sm"
                      onClick={()=>this.setSortKey("Category")}
                    >{edgePrompts.category.label} {this.sortSymbol("Category")}</Button></th>
                <th width="10%" hidden={edgePrompts.citation.hidden}><Button size="sm"
                      onClick={()=>this.setSortKey("Citations")}
                    >{edgePrompts.citation.label} {this.sortSymbol("Citations")}</Button></th>
                <th width="17%" hidden={edgePrompts.notes.hidden}><Button size="sm"
                      onClick={()=>this.setSortKey("Notes")}
                    >{edgePrompts.notes.label} {this.sortSymbol("Notes")}</Button></th>
                <th  width="17%"hidden={edgePrompts.info.hidden}><Button size="sm"
                      onClick={()=>this.setSortKey("Info")}
                    >{edgePrompts.info.label} {this.sortSymbol("Info")}</Button></th>
                <th  width="17%"hidden={!isLocalHost}><Button size="sm"
                      onClick={()=>this.setSortKey("Updated")}
                    >Updated {this.sortSymbol("Updated")}</Button></th>
              </tr>
            </thead>
            <tbody style={{ maxHeight: tableHeight }}>
            {this.state.edges.map( (edge,i) => (
              <tr key={i}>
                <td hidden={!DBG}>{edge.id}</td>
                <td hidden={!DBG}>{edge.size}</td>
                <td><Button size="sm" outline
                      value={edge.id}
                      onClick={this.onButtonClick}
                    >Edit</Button>
                </td>
                <td><a href="#" onClick={(e)=>this.selectNode(edge.source.id,e)}
                    >{edge.source.label || edge.source}</a></td>
                <td>{edge.attributes["Relationship"]}</td>
                <td><a href="#" onClick={(e)=>this.selectNode(edge.target.id,e)}
                    >{edge.target.label || edge.target}</a></td>
                <td hidden={edgePrompts.category.hidden}>{edge.attributes["Category"]}</td>
                <td hidden={edgePrompts.citation.hidden}>{edge.attributes["Citations"]}</td>
                <td hidden={edgePrompts.notes.hidden}><MDReactComponent text={edge.attributes["Notes"]} onIterate={this.markdownIterate} markdownOptions={{typographer: true}} plugins={[mdplugins.emoji]}/></td>
                <td hidden={edgePrompts.info.hidden}>{edge.attributes["Info"]}</td>
                <td hidden={!isLocalHost}>{this.displayUpdated(edge)}</td>
              </tr>
            ))}
            </tbody>
          </Table>
        </div>
      );
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentDidMount () {
      if (DBG) console.log('EdgeTable.componentDidMount!');
    }

    markdownIterate(Tag, props, children, level){
  if (Tag === 'a') {
    props.target = '_blank';
    }

  return <Tag {...props}>{children}</Tag>;

}

  displayUpdated(nodeEdge)
  {
      var d = new Date(nodeEdge.meta.revision > 0 ? nodeEdge.meta.updated : nodeEdge.meta.created);

      var year = "" + d.getFullYear();
      var date = (d.getMonth()+1)+"/"+d.getDate()+"/"+ year.substr(2,4);
      var time = d.toTimeString().substr(0,5);
      var dateTime = date+' at '+time;
      var titleString = "v" + nodeEdge.meta.revision + " by " + nodeEdge._elog[nodeEdge._elog.length-1];
      var tag = <span title={titleString}> {dateTime} </span>;

      return tag;
  }
} // class EdgeTable


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = EdgeTable;
