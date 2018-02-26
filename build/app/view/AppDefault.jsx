const React = require('react');
const D3 = require('d3');

module.exports = class AppDefault extends React.Component {
	render() {
		return (
			<p>AppDefault component</p>
		);
	}
	componentDidMount () {
		console.log('D3',D3);
	}
}

