if (window.NC_DBG) console.log(`inc ${module.id}`);
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Used by render()'s <Switch> to load a React component (what we call a
  'view' in the NetCreate app). The component should return its elements
  wrapped in a div with the suggested flexbox pr

  index.html           | body          min-height: 100%
  index.html           | div#app
  init-appshell        |   div         display:flex, flex-flow:column nowrap,
                                        width:100%, height:100vh
  init-appshell        |     Navbar    position:fixed
  --- COMPONENT BELOW ---
  <RequiredComponent>  |     div       this is a child of a flexbox

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');

/// DEFAULT APPLICATION COMPONENT /////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class AppDefault extends React.Component {
  constructor() {
    super();
    /* UNISYS LIFECYCLE INITIALIZATION */
    // initialize UNISYS before declaring any hook functions
    UNISYS.SystemInitialize('assets/htmldemos/d3forcedemo');
  }
  render() {
    return (
      <div
        style={{
          display: 'flex',
          flexFlow: 'row nowrap',
          width: '100%',
          height: '100%'
        }}
      >
        <div id="left" style={{ flex: '1 0 auto' }}></div>
        <div id="middle" style={{ flex: '3 0 auto' }}>
          <p>AppDefault.jsx</p>
          <h4>NetCreate welcomes you</h4>
          <p>This is a work in progress.</p>
        </div>
        <div id="right" style={{ flex: '1 0 auto' }}></div>
      </div>
    );
  }
  componentDidMount() {
    console.log('AppDefault mounted');
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AppDefault;
