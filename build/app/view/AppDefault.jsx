/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');

/** REACT COMPONENT **********************************************************\
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
\* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
class AppDefault extends React.Component {
	render() {
		return (
		<div style={{display:'flex', flexFlow:'row nowrap',
		     width:'100%', height:'100%'}}>
			<div id="left" style={{flex:'1 0 auto'}}>
			</div>
			<div id="middle" style={{flex:'3 0 auto'}}>
				<p></p>
				<h4>NetCreate welcomes you</h4>
				<p>This is a work in progress.</p>
			</div>
			<div id="right" style={{flex:'1 0 auto'}}>
			</div>
		</div>
		);
	}
	componentDidMount () {
		console.log('AppDefault mounted');
	}
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AppDefault;