module.exports = {

	files: {
	// NOTE: brunch includes ONLY files referred to by require() statements
	// NOTE: app, vendor, public are relative to this config file
	// NOTE: any directory is fair game for fileglob patterns
		javascripts: {
			joinTo: {
				'netc-app.js'   : /^app/,
				'netc-lib.js'   : /^(?!app)/
			}
		},
		stylesheets: {
			joinTo              : 'netc-app.css'
		}
	},

	plugins: {
		babel: {
		// brunch-babel plugin requires additional babel settings to enable jsx processing
		// npm i --save-dev babel babel-preset-env babel-preset-react
		// npm i --save-dev babel-brunch@github:babel/babel-brunch
			presets   : ['env', 'react']
		}
	},

	server: {
		port   : 3000
	}

};
