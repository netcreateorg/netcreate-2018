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
class NodeTable extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodePrompts: this.AppState('TEMPLATE').nodePrompts,
      nodes: [],
      // edgeCounts: {},         // {nodeID:count,...}
      filteredNodes: [],
      isExpanded: true,
      sortkey: 'label'
    };

    this.handleDataUpdate = this.handleDataUpdate.bind(this);
    this.handleFilterDataUpdate = this.handleFilterDataUpdate.bind(this);
    this.OnTemplateUpdate = this.OnTemplateUpdate.bind(this);
    this.onButtonClick = this.onButtonClick.bind(this);
    this.onToggleExpanded = this.onToggleExpanded.bind(this);
    this.setSortKey = this.setSortKey.bind(this);
    this.sortSymbol = this.sortSymbol.bind(this);

    this.sortDirection = -1;

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    // Always make sure class methods are bind()'d before using them
    // as a handler, otherwise object context is lost
    this.OnAppStateChange('D3DATA', this.handleDataUpdate);

    // Handle Template updates
    this.OnAppStateChange('TEMPLATE', this.OnTemplateUpdate);

    // Track Filtered Data Updates too
    // UDATA.HandleMessage('FILTEREDD3DATA', (data) => {
    this.OnAppStateChange('FILTEREDD3DATA', this.handleFilterDataUpdate);

  } // constructor

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentDidMount () {
      if (DBG) console.error('NodeTable.componentDidMount!');
      // Explicitly retrieve data because we may not have gotten a D3DATA
      // update while we were hidden.

      // filtered data needs to be set before D3Data
      const FILTEREDD3DATA = UDATA.AppState('FILTEREDD3DATA');
      this.setState({ filteredNodes: FILTEREDD3DATA.nodes },
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
  /*/ Handle updated SELECTION
  /*/
  handleDataUpdate(data) {
    if (DBG)
      console.log('handle data update')

    // 2020-09-09 Removing this check and relying on other NodeTable optimizations. BL
    // if (data.bMarkedNode)
    //   {
    //     //data.bMarkedNode = false;
    //     // counting on the edge table going second, which is sloppy
    //     // but we are in a rush, so ... do it that way for now
    //   }
    // else
    // {}

    if (data.nodes) {
      // const edgeCounts = this.countEdges(data.edges);
      const nodes = this.sortTable(this.state.sortkey, data.nodes);
      this.setState({
        nodes: nodes,
        // edgeCounts: edgeCounts
      });
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  OnTemplateUpdate(data) {
    this.setState({nodePrompts: data.nodePrompts});
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
        // let edgeCounts = this.state.edgeCounts;
        return nodes.sort( (a, b) => {
            let akey = a.degrees || 0,
              bkey = b.degrees || 0;
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
          let akey = a.label?a.label:'',
              bkey = b.label?b.label:'';
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ sortByUpdated(nodes)
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
    Returns the sorted nodes so that the calling function can handle
    state updates all at once.
/*/ sortTable ( sortkey=this.state.sortkey, nodes ) {
      switch (sortkey) {
        case 'id':
          return this.sortByID(nodes);
          break;
        case 'edgeCount':
          return this.sortByEdgeCount(nodes);
          break;
        case 'type':
          return this.sortByAttribute(nodes, 'Node_Type');
          break;
        case 'notes':
          return this.sortByAttribute(nodes, 'Notes');
          break;
        case 'info':
          return this.sortByAttribute(nodes, 'Extra Info');
          break;
        case 'Updated':
          return this.sortByUpdated(nodes);
          break;
        case 'label':
        default:
          return this.sortByLabel(nodes);
          break;
      }
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

      const nodes = this.sortTable(key, this.state.nodes);
      this.setState({ sortkey: key, nodes });
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
/*/
render() {
  if (this.state.nodes === undefined) return "";
  let { nodePrompts } = this.state;
  let { tableHeight } = this.props;
  let styles = `thead, tbody { font-size: 0.8em }
                thead { position: relative; }
                tbody { overflow: auto; }
                .btn-sm { font-size: 0.6rem; padding: 0.1rem 0.2rem }
                `
  return (
    <div style={{overflow:'auto',
      position:'relative',display: 'block', left: '1px', right:'10px',maxHeight: tableHeight, backgroundColor:'#eafcff'
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
            <th width="4%" hidden={!DBG}>ID</th>
            <th width="4%"><Button size="sm"
                  onClick={() => this.setSortKey("edgeCount")}
                >{nodePrompts.degrees.label} {this.sortSymbol("edgeCount")}</Button></th>
            <th width="15%"><Button size="sm"
                  onClick={()=>this.setSortKey("label")}
                >{nodePrompts.label.label} {this.sortSymbol("label")}</Button></th>
            <th width="10%"hidden={nodePrompts.type.hidden}>
                <Button size="sm"
                  onClick={()=>this.setSortKey("type")}
                >{nodePrompts.type.label} {this.sortSymbol("type")}</Button></th>
            <th width="20%"hidden={nodePrompts.info.hidden}>
                <Button size="sm"
                  onClick={()=>this.setSortKey("info")}
                >{nodePrompts.info.label} {this.sortSymbol("info")}</Button></th>
            <th width="30%" hidden={nodePrompts.notes.hidden}>
                <Button size="sm"
                  onClick={()=>this.setSortKey("notes")}
                >{nodePrompts.notes.label} {this.sortSymbol("notes")}</Button></th>
            <th  width="10%"hidden={!isLocalHost}><Button size="sm"
                  onClick={()=>this.setSortKey("Updated")}
                >Updated {this.sortSymbol("Updated")}</Button></th>
          </tr>
        </thead>
        <tbody style={{maxHeight: tableHeight}}>
        {this.state.nodes.map( (node,i) => (
          <tr key={i}>
            <td><Button size="sm" outline
                  value={node.id}
                  onClick={this.onButtonClick}
                >Edit</Button>
            </td>
            <td hidden={!DBG}>{node.id}</td>
            <td>{node.degrees}</td>
            <td><a href="#" onClick={(e)=>this.selectNode(node.id,e)}
                >{node.label}</a></td>
            <td hidden={nodePrompts.type.hidden}>{node.attributes["Node_Type"]}</td>
            <td hidden={nodePrompts.info.hidden}>{node.attributes["Extra Info"]}</td>
            <td hidden={nodePrompts.notes.hidden}>
              {node.attributes["Notes"] ? <MarkdownNote text={node.attributes["Notes"]} /> : "" }
            </td>
            <td hidden={!isLocalHost}>{this.displayUpdated(node)}</td>
          </tr>
        ))}
        </tbody>
      </Table>
    </div>
  );

}

} // class NodeTable




/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NodeTable;
