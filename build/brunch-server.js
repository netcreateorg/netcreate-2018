/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	NODE CUSTOM SERVER
	brunch-server.js is automatically used by brunch if it exists

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const express = require('express');
const app     = express();

/// SERVER STATIC FILES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	app.use( express.static(__dirname + '/public') );

/// WEBSERVICE STUB ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	app.post('/action', (req, res, next) => {
		res.send('POST action completed!');
	});

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Export the module like this for Brunch.
/*/ module.exports = (config, callback) => {

		app.listen(config.port, function () {
			console.log(`APP SERVER LISTENING on PORT ${config.port}`);
			callback();
		});

		// Return the app; it has the `close()` method, which would be ran when
		// Brunch server is terminated. This is a requirement.
		return app;

	};
