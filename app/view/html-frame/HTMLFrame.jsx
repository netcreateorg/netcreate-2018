const React = require('react');

/// 2. ROUTED FUNCTIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
    Used by render()'s <Switch> to load a plain html page that is
    located at app/htmldemos/<route>/<route.html>

    index.html           | body          min-height: 100%
    index.html           | div#app
    init-appshell        |   div         display:flex, flex-flow:column nowrap,
                                        width:100%, height:100vh
    init-appshell        |     Navbar    position:fixed
    --- COMPONENT BELOW ---
    init-appshell.HTML() |     div       display:flex, flex-flow:column nowrap,
                                        width:100%
    init-appshell.HTML() |       iframe  flex:1 0 auto, border:0
/*/
function HTMLFrame(props) {
  SETTINGS.ForceReloadOnNavigation();
  let loc;
  if (props && props.location && props.location.pathname) {
    loc = props.location.pathname.substring(1);
  }
  loc = '/htmldemos/' + loc + '/' + loc + '.html';
  return (
    <div
      style={{
        display: 'flex',
        flexFlow: 'column nowrap',
        width: '100%',
        height: '100%'
      }}
    >
      <iframe style={{ flex: '1 0 auto', border: '0' }} src={loc} />
    </div>
  );
}

module.exports = HTMLFrame;
