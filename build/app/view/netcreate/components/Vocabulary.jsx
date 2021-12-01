/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    Vocabulary displays a list of common terms



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Table }    = ReactStrap;

const UNISYS   = require('unisys/client');


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class Vocabulary extends UNISYS.Component {
    constructor (props) {
      super(props);
      this.state = {isExpanded: true};

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
        let { tableHeight } = this.props;

      return (
        <div className="help"
             style={{ overflow: 'auto', maxWidth: '50%', position: 'fixed', right: '10px',
                      maxHeight: tableHeight
             }}>
          <Button size="sm" outline hidden
            style={{float:'right'}}
            onClick={this.onToggleExpanded}
          >{this.state.isExpanded ? "Hide Vocabulary" : "Vocabulary"}</Button>
          <div hidden={!this.state.isExpanded}
            style={{backgroundColor:'rgba(240,240,240,0.95)',padding:'10px 20px'}}>

            <dl>
             <dt>Network</dt>
            <dd>This is a collection of nodes and the edges between them. </dd>

            <dt>Graph</dt>
            <dd>a graphic representation of a network and its components. <em><strong>Similar terms include:</strong> sociogram, visualization</em></dd>

           <dt>Node</dt>
            <dd>The thing or <em>entity</em> (shown as circles) that is connected through relationships. This could be individual people, groups of people, institutions (like churches, organizations, schools). One way of thinking about this is that nodes are nouns and edges are verbs - nodes are things that are connected through edges. <em><strong>Similar terms include:</strong> actor, vertex</em></dd>
             <ul>
             <dl>
                <dt>Ego</dt>
                <dd>This refers to the node you are focused on at the moment and the connections that they have. </dd>
            </dl>
            </ul>

            <dt>Edge</dt>
            <dd>The relationships between nodes you are considering (shown as lines). Relationships can take on many forms: nodes could be connected through somewhat intangible relationships, such as friendship or not liking one another. Edges can be based on interactions, such as talking to one another or being in conflict. They could also be defined by sharing resources, such as money or information. <em><strong>Similar terms include:</strong> line, tie, arc</em></dd>

              <ul><dl>
              <dt>Edge weight</dt>
              <dd>Edges can have a value attached to them. So, for instance, an node could sent $10,000 to another actor. Or, they could share three interactions of the same type with one another. This value is referred to as a weight. <em><strong>Similar terms include:</strong> value</em></dd>

              <dt>Directed or undirected edges</dt>
              <dd>Edges can either be directed or undirected. If a relationship is directed, it is being sent from (originating from) one node to another node. Node A may say they are friends with Node B, but Node B does not say Node A does this. Or Node A gives Node B something, such as resources, information, or an illness. However, in some cases, edges are defined as undirected. Two people who share a meal together or are married are both engaged share an undirected edge. <em>Note: in some academic literatures, the term "edge" is reserved for an undirected relationship, while the term "arc" is used to refer to directed ties.</em></dd>
              </dl></ul>

            <dt>Attributes</dt>
            <dd>Characteristics of the nodes or edges. A node could be designated by gender, for instance or the amount of wealth they possess. They could also be characteristics you find from the network itself - such as how many ties an node has (degree centrality). </dd>

            <dt>Centrality</dt>
            <dd>This is a way of ranking the importance of individuals within a network. There are many different ways to measure importance, such as degree centrality, betweenness centrality, and eigenvector centrality.  </dd>
            <ul> <dl>

            <dt>Degree Centrality</dt>
            <dd>Degree centrality is a measure of how many connections a node has. An node with many ties that are being sent to them has a high in-degree centrality. In a friendship network, this can be easily recognized as popularity. Nodes sending many outgoing ties (high out-degree centrality) may be thought of as expansive in their relationship.</dd>

            <dt>Betweenness Centrality</dt>
            <dd>Nodes with high betweenness centrality serve as connectors between other individuals who wouldn't otherwise be directly connected. They may not be connected to a large number of people (that would be high degree centrality), but they are unique in their connections. If an actor with high betweenness centrality was removed from a network, the network would be more fragmented and less connected. Often researchers are interested in finding actors with high betweenness centrality because they can control whatever flows in the networks. For instance, military analysts often look for nodes with high betweenness in a terrorist network.</dd>

            <dt>Eigenvector Centrality</dt>
            <dd>Eigenvector centrality ranks actors based on their connection to other highly central nodes. So, a nodes importance as measured by eigenvector centrality are dependent on the other nodes with whom they share connections. Google's PageRank algorithm was a famous application of a version of this type of centrality, and allowed them to return highly relevant results in search for users.</dd>
            </dl></ul>

            <dt>Communities</dt>
            <dd>A community in a network is a way of thinking about grouping, often by finding densely connected sets of nodes. A community within a network that is tightly connected to one another but not to an outside group might be seen as a faction, such as rival political groups. In this case, nodes with high betweenness centrality in a network with multiple factions might be some of the only points of contact between rival groups - a potentially powerful but also difficult position to be in.</dd>
            </dl>
          </div>
        </div>
      );
    }

} // class Vocabulary


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Vocabulary;
