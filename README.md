## PROJECT SUMMARY

This is the developer's "NetCreate 2.0" branch, forked from [NetCreate 2018](https://github.com/netcreateorg/netcreate-2018)'s `dev` branch. We will be doing the experimental development stuff here independent from the main repo to avoid changing how it works by accident, as there is quite a lot of architectural refactoring we need to do. If you are not a developer for NetCreate 2.0, this repo will likely only have curiosity value to you.

## QUICK INSTALL AND RUN

### First Install
```
nvm use
npm ci
# create default netcreate.config file
./nc.js --dataset=testproject
```
This will start up the app server. View the webapp by visiting `localhost#3000`. The IP address of the server is reported in console if you need to test from remote computer.

### Subsequent Runs
```
npm run dev
```
This will load the dataset defined and set by the `nc.js` command during first install. 
To change the default dataset, use the `./nc.js --dataset=projectname` command.

### Generating Logins

Run NetCreate server and browse to the web app. Enter the console and type `ncMakeTokens('class','prj','testproject',5);` to generate 5 login tokens.

To access the Import/Export and Template Editor, you will need to enable admin mode in one of two ways:

* use `localhost:3000` instead of the ip address.
* if on a remote, login with a login token and append `?admin=true` to the end of the URL (e.g. http://192.168.1.100:3000/#/edit/TEST-TEST-GXK**?admin=true**)


## NETCREATE-ITEST (2.0) FEATURE SUMMARY

MAJOR USER FEATURE REQUESTS

* integrated data provenance
* integrated commenting
* individual data/metadata tied to shared network
* increased adaptability and scaffolding for projects

MAJOR SYSTEM FEATURE REQUESTS

* authentication and logins
* secure encrypted data
* weights on edges w/ calculation
* form validation
* improved table filtering
* URL-encoded filtering and view options
* tag as a clickable UI element, not just a string
* help tied to node/edge type (optional)
* suggest accessible colors/colorblind friendly
* network visual collapse based on filtering
* collapsible subnetworks
* easy-to-understand visual theming system for UI elements



