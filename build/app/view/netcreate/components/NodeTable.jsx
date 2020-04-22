/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    NodeTable is used to to display a table of nodes for review.


  ## TO USE

    NodeTable is self contained and relies on global D3DATA to load.

      <NodeTable/>

  ## 2018-12-07 Update

    Since we're not using tab navigation:
    1. The table isExpanded is now true by default.
    2. The "Show/Hide Table" button is hidden.

    Reset these to restore previous behavior.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// MD React stuff added by Joshua ... probably could be placed better
import MDReactComponent from 'markdown-react-js';
const mdplugins = {
  emoji: require('markdown-it-emoji')
};

var DBG = false;

const SETTINGS     = require('settings');
const isLocalHost  = (SETTINGS.EJSProp('client').ip === '127.0.0.1') || (location.href.includes('admin=true'));

const PerformanceCutoff = 50; // to only use certain optimizations that impact experience on large data sets


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
class NodeTable extends UNISYS.Component {
    constructor (props) {
      super(props);

      this.state = {
        nodePrompts:  this.AppState('TEMPLATE').nodePrompts,
        nodes: [],
        edgeCounts: {},         // {nodeID:count,...}
        isExpanded:   true,
        sortkey:      'label'
      };

      this.onButtonClick            = this.onButtonClick.bind(this);
      this.onToggleExpanded         = this.onToggleExpanded.bind(this);
      this.setSortKey               = this.setSortKey.bind(this);
      this.sortSymbol               = this.sortSymbol.bind(this);

      this.sortDirection = -1;

      /// Initialize UNISYS DATA LINK for REACT
      UDATA = UNISYS.NewDataLink(this);

      // Always make sure class methods are bind()'d before using them
      // as a handler, otherwise object context is lost
      this.OnAppStateChange('D3DATA',(data) => {
        this.handleDataUpdate(data);
      });

      // Handle Template updates
      this.OnAppStateChange('TEMPLATE',(data) => {
        this.setState({nodePrompts: data.nodePrompts});
      });

    } // constructor



/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle updated SELECTION
/*/
handleDataUpdate(data) {
  if(data.bMarkedNode)
      {
        //data.bMarkedNode = false;
        // counting on the edge table going second, which is sloppy
        // but we are in a rush, so ... do it that way for now
      }
    else
    {
    if (data.nodes) {

        this.countEdges();
        this.setState({nodes: data.nodes});
        this.sortTable();
      }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Build table of counts
/*/
countEdges() {
  let edgeCounts = this.state.edgeCounts;
  this.AppState('D3DATA').edges.forEach( edge => {
    edgeCounts[edge.source] = edgeCounts[edge.source]!==undefined ? edgeCounts[edge.source]+1 : 1;
    edgeCounts[edge.target] = edgeCounts[edge.target]!== undefined ? edgeCounts[edge.target]+1 : 1;
  })
  this.setState({ edgeCounts: edgeCounts });
}


/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortByID (nodes) {
      if (nodes) {
        return nodes.sort( (a,b) => {
          let akey = a.id,
              bkey = b.id;
          if (akey<bkey) return -1*this.sortDirection;
          if (akey>bkey) return 1*this.sortDirection;
          return 0;
        });
      }
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortByEdgeCount(nodes) {
      if (nodes) {
        let edgeCounts = this.state.edgeCounts;
        return nodes.sort( (a, b) => {
          let akey = edgeCounts[a.id] || 0,
            bkey = edgeCounts[b.id] || 0;
          // sort descending
          if (akey > bkey) return 1*this.sortDirection;
          if (akey < bkey) return -1*this.sortDirection;
          return 0;
        });
      }
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortByLabel (nodes) {
      if (nodes) {
        return nodes.sort( (a,b) => {
          let akey = a.label,
              bkey = b.label;
          return (akey.localeCompare(bkey)*this.sortDirection);
        });
      }
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortByAttribute (nodes, key) {
      if (nodes) {
        return nodes.sort( (a,b) => {
          let akey = a.attributes[key],
              bkey = b.attributes[key];
          if (akey<bkey) return -1*this.sortDirection;
          if (akey>bkey) return 1*this.sortDirection;
          return 0;
        });
      }
    }

    /// ---
    sortByUpdated(nodes)
    {
      if (nodes) {
        return nodes.sort( (a,b) => {
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
      let nodes = this.state.nodes;
      switch (sortkey) {
        case 'id':
          this.sortByID(nodes);
          break;
        case 'edgeCount':
          this.sortByEdgeCount(nodes);
          break;
        case 'type':
          this.sortByAttribute(nodes, 'Node_Type');
          break;
        case 'notes':
          this.sortByAttribute(nodes, 'Notes');
          break;
        case 'info':
          this.sortByAttribute(nodes, 'Extra Info');
          break;
        case 'Updated':
          this.sortByUpdated(nodes);
          break;
        case 'label':
        default:
          this.sortByLabel(nodes);
          break;
      }
      this.setState({nodes: nodes});
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

      // REVIEW: For some reason React converts the integer IDs into string
      // values when returned in event.target.value.  So we have to convert
      // it here.
      let nodeID = parseInt( event.target.value );
      UDATA.LocalCall('SOURCE_SELECT',{ nodeIDs: [nodeID] })
      .then(() => {
        if (DBG) console.error('NodeTable: Calling NODE_EDIT', nodeID);
        UDATA.LocalCall('NODE_EDIT', { nodeID: nodeID });
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

      // REVIEW: For some reason React converts the integer IDs into string
      // values when returned in event.target.value.  So we have to convert
      // it here.
      // Load Source
      UDATA.LocalCall('SOURCE_SELECT',{ nodeIDs: [parseInt(id)] });
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
      let { nodePrompts } = this.state;
      let { tableHeight } = this.props;
      let styles = `thead, tbody {  }
                    thead { position: relative; }
                    tbody { overflow: auto; }
                    `
      return (
         <div style={{overflow:'auto',
                     position:'relative',display: 'block', right:'10px',maxHeight: tableHeight, backgroundColor:'#eafcff'
             }}>
          <style>{styles}</style>
          <Button size="sm" outline hidden
            onClick={this.onToggleExpanded}
          >{this.state.isExpanded ? "Hide Node Table" : "Show Node Table"}</Button>
          <Table hidden={!this.state.isExpanded} hover size="sm"
                 responsive striped
                 className="nodetable w-auto"
          >
            <thead>
              <tr>
                <th width="4%"><div style={{color: '#f3f3ff'}}>_Edit_</div></th>
                <th width="12%"><Button size="sm"
                      onClick={() => this.setSortKey("edgeCount")}
                    >{nodePrompts.degrees.label} {this.sortSymbol("edgeCount")}</Button></th>
                <th width="15%"><Button size="sm"
                      onClick={()=>this.setSortKey("label")}
                    >{nodePrompts.label.label} {this.sortSymbol("label")}</Button></th>
                <th width="15%"hidden={nodePrompts.type.hidden}>
                    <Button size="sm"
                      onClick={()=>this.setSortKey("type")}
                    >{nodePrompts.type.label} {this.sortSymbol("type")}</Button></th>
                <th width="26%"hidden={nodePrompts.info.hidden}>
                    <Button size="sm"
                      onClick={()=>this.setSortKey("info")}
                    >{nodePrompts.info.label} {this.sortSymbol("info")}</Button></th>
                <th width="26%" hidden={nodePrompts.notes.hidden}>
                    <Button size="sm"
                      onClick={()=>this.setSortKey("notes")}
                    >{nodePrompts.notes.label} {this.sortSymbol("notes")}</Button></th>
                <th  width="20%"hidden={!isLocalHost}><Button size="sm"
                      onClick={()=>this.setSortKey("Updated")}
                    >Updated {this.sortSymbol("Updated")}</Button></th>
              </tr>
            </thead>
            <tbody style={{maxHeight: tableHeight}}>
            {this.state.nodes.map( (node,i) =>
              <tr key={i}>
                <td><Button size="sm" outline
                      value={node.id}
                      onClick={this.onButtonClick}
                    >Edit</Button>
                </td>
                <td>{this.state.edgeCounts[node.id]}</td>
                <td><a href="#" onClick={(e)=>this.selectNode(node.id,e)}
                    >{node.label}</a></td>
                <td hidden={nodePrompts.type.hidden}>{node.attributes["Node_Type"]}</td>
                <td hidden={nodePrompts.info.hidden}>{node.attributes["Extra Info"]}</td>
                <td hidden={nodePrompts.notes.hidden}><MDReactComponent text={node.attributes["Notes"]} onIterate={this.markdownIterate} markdownOptions={{typographer: true}} plugins={[mdplugins.emoji]}/></td>
                <td hidden={!isLocalHost}>{this.displayUpdated(node)}</td>
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
      if (DBG) console.log('NodeTable.componentDidMount!');
    }


shouldComponentUpdate(nextProps, nextState) {
        let bReturn = true;

        if(this.state.nodes.length > PerformanceCutoff && nextProps.bIgnoreTableUpdates && nextState == this.state)
          bReturn = false;

        return bReturn;
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
      var titleString = "v" + nodeEdge.meta.revision + " by " + nodeEdge._nlog[nodeEdge._nlog.length-1];
      var tag = <span title={titleString}> {dateTime} </span>;

      return tag;

  }

} // class NodeTable




/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NodeTable;
