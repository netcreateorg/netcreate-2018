/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	BRUNCH CONFIGURATION

	Brunch is a "task runner" that performs the common operations for
	developing webapps. Essentially it transforms your source files and
	copies them to a 'public' directory, where a built-in webserver can
	make them available to viewing in a browser by visiting localhost.
	It also supports "plugins" to provide additional functions like source
	code minification and transpiling other script languages into pure CSS
	and Javascript. This is similar to other popular task runners like
	Webpack, Grunt, and Gulp.

	We're using Brunch for NetCreate because  it has a 'minimal
	configuration' philosophy. Although you still do need to do some
	configuration (see below) it's a lot less confusing than either Grunt or
	Webpack, and is considerably less verbose than Gulp. Brunch is also a
	mature project (6+ years) so it is a fairly safe bet moving forward.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// CommonJS module format
// exports a configuration object
module.exports = {

/// CONCATENATION /////////////////////////////////////////////////////////////
/*/ Brunch intelligently combines source javascript, stylesheets, and
	templates into single files. It includes not only your source files in
	the app/ directory, but is smart enough to look in node_modules/ and
	vendor/ directories. The joinTo property allows multiple ways to define
	all the sources you want combined into the named file.
	- - -
	NOTE: brunch includes ONLY files referred to by require() statements
	NOTE: app, vendor, public are relative to this config file
	NOTE: any directory is fair game for pattern matching
/*/ files: {
		javascripts: {
			joinTo: {
				'netc-app.js'   : /^app/,
				'netc-lib.js'   : /^(?!app)/
			}
		},
		stylesheets: {
			joinTo : {
				'netc-app.css'  : [
					/^app/,
					/^node_modules/
				]
			}
		}
	},

/// PLUGIN CONFIGURATION //////////////////////////////////////////////////////
/*/ Brunch plugins generally work without configuration, but sometimes you need
	to do it, particularly for plugins that interface with other npm packages
	with their own configuration requirements (e.g. babel)
/*/ plugins: {
		babel: {
		// brunch-babel plugin requires additional babel settings to enable jsx processing
		// npm i --save-dev babel babel-preset-env babel-preset-react
		// npm i --save-dev babel-brunch@github:babel/babel-brunch
			presets   : ['env', 'react']
		}
	},

/// SERVER CONFIGURATION //////////////////////////////////////////////////////
/*/ Brunch will use its internal server unless a brunch-server.js module is
	present. The module should return a function that accepts a config obj and
	a callback function that is invoked when the server is done initializing.
	It should return an object with a close() method (as ExpressJS app does)
/*/ server: {
		// viewing url is http://localhost:3000
		port   : 3000
	},

/// NPM INTEGRATION ///////////////////////////////////////////////////////////
/*/ Brunch is aware of the node_modules directory but sometimes needs help to
	find the right source files to include in processing.
/*/ npm: {
		styles: {
		/// include these css files in the stylesheets joinTo
			bootstrap: ['dist/css/bootstrap.min.css']
		}
	}

};
