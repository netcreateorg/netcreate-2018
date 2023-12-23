## PROJECT SUMMARY

NetCreate 2018 is a network graph analysis tool for researching reading comprehension in the digital humanities classroom. See the [NetCreate Wiki](https://github.com/netcreateorg/netcreate-2018/wiki) for additional documentation.



**This is a work in progress. Please see [Developer 2.0 Work in Progress Branch](#developer-2-0-work-in-progress-branch) at the bottom for current notes.**



## CITATION

If you use or refer to Net.Create in a publication, we ask that you cite it. The correct citation is: Craig, K. & Danish, J. (2018). Net.Create. http://www.netcreate.org. Indiana University, IN.

## QUICK INSTALLATION

The Wiki has [detailed instructions](https://github.com/netcreateorg/netcreate-2018/wiki/Installation-Guide). In general, you'll need to install the prerequisite `Git` and `NodeJS` (as of 12/23/2023 the officially supported version of Node is version 18.18.0) command line utilities to your computer and use a `terminal` program to issue the following commands to install from the Internet.

### 1. First Install

The first time you run Net.Create, you need to do some initial setup.

```
git clone https://github.com/netcreateorg/netcreate-itest.git
cd netcreate-itest
git checkout dev
nvm use
npm ci
# create default netcreate.config file
./nc.js --dataset=demo
```

This will get NetCreate installed and ready to run. It may take some time for the `npm ci` command to finish installing, so be patient!

The first time you run Net.Create, you also need to create a `net-create.config` file.  This will tell Net.Create which dataset to open and which ports to use.  We have a script that can do this for you.  Run:

* `./nc.js --dataset=demo` -- where `demo` will be the name of the dataset you want to use.

This will start up the app server. View the webapp by visiting `localhost:3000`. The IP address of the server is reported in console if you need to test from remote computer.

### 2. Subsequent Runs

After you've installed Net.Create, you can just run this script whenever you want to start the app:

```
npm run dev
```

This will load the dataset defined and set by the `nc.js` command during first install. 
To change the default dataset, use the `./nc.js --dataset=projectname` command.

### 3. Generating Logins

Run NetCreate server and browse to the web app. Enter the console and type `ncMakeTokens('class','prj','demo',5);` to generate 5 login tokens.

To access the Import/Export and Template Editor, you will need to enable admin mode in one of two ways:

* use `localhost:3000` instead of the ip address.
* if on a remote, login with a login token and append `?admin=true` to the end of the URL (e.g. `192.168.1.100:3000/#/edit/TEST-TEST-GXK?admin=true`)

## NPM SCRIPTS

Once you have NetCreate installed, make sure you are in the `netcreate-itest` directory. From there, you can execute **scripts** through the `npm` tool that is installed as part of NodeJS. 

You will be using these commands most frequently:

* `npm run dev` - Run the NetCreate Server in developer mode. This is the mode that most people use the most. The terminal will print status and instructions on how to connect to the NetCreate Server with the Chrome browser. An optional command (`./nc.js --dataset=projectname`) can create/load a specific database and template file. See the User Guide for more information.
* `npm run log` - While NetCreate is running, use another terminal window to print the contents of the current **session log**. You can use this to monitor the activity of the running server.
* `npm run package` - Make the 'standalone' version! After a NetCreate classroom session, use this command to make a snapshot of the current database and placed in the `netcreate-2018/build/public` directory. You can copy this directory to a webserver for read-only access to the netgraph!
* `npm run package:debug` - Run/debug the current standalone version from http://localhost:3000


## QUICK-START USER GUIDE

**How to access Net.Create as a client:** After starting the Net.Create server, you'll see a set of command line responses. One of those is labeled "CLIENTS" and has an IP address that clients can paste into their browser window's address field to access the main Net.Create server.

**How to add/change node/edge entries in Net.Create:** Net.Create defaults to a view-only state. In order to make any additions/changes to the Net.Create database, each client needs an access token entered in the "Login" field in the upper left-hand corner of the Net.Create window. See `ncMakeTokens` below in "Support Operations".

**How to change node/edge types and select a different project:** Two files in the /build/runtime folder hold both data (netcreate.loki) and template (netcreate.template). You can copy and rename these file pairs (i.e. netcreate.template/loki -> mynetwork.template/loki) and then use that to run the server (`./nc.js --dataset=mynetwork`).

## SUPPORT OPERATIONS

To generate **access keys** for groups, there is a utility accessible from the **javascript console** of a browser that's running the NetCreate app. 

* Open the javascript console (in MacOS Chrome, COMMAND-OPTION-J will open it)
* Type `ncMakeTokens('<class>','<project>',10)` to create 10 **group access tokens** that can be used to connect to the application. `<class>` and `<project>` are short strings used to uniquely identify each class and project. The access tokens are case-insensitive and 
* The group access tokens can be generated ahead-of-time and assigned during class. If you need more access tokens, you can easily increase the number. These tokens will be used to tag every logged action performed by connected computers.
* Students within a group and append a string of the form `-ID<#>`, where `<#>` is a positive integer to uniquely identify their computer. They can tell the teacher which ID they used.

To **erase the database**, another javascript console command `ncEmptyDatabase()` will erase the server database. You may have to issue the command twice for it to take hold. Then refresh the browser and see if the database was erased.

All **session logs** are stored in `netcreate-2018/build/runtime/logs`.

The **server database** is stored in `netcreate-2018/build/runtime/netcreate.loki` if you use `npm run dev` to start the server. You can copy this file to back it up, even while the server is running.

The **node/edge templates** are stored in `netcreate-2018/build/runtime/netcreate.template` if you use `npm run dev` to start the server.

---

---


---

## Developer 2.0 Work in Progress Branch

This is currently tagged v1.5.0, but in fact, this is the developer's "NetCreate 2.0" branch, forked from [NetCreate 2018](https://github.com/netcreateorg/netcreate-2018)'s `dev` branch. We will be doing the experimental development stuff here independent from the main repo to avoid changing how it works by accident, as there is quite a lot of architectural refactoring we need to do. If you are not a developer for NetCreate 2.0, this repo will likely only have curiosity value to you.

Note: 

* The default branch is **dev**, not master. 
* When creating pull requests in GitHub, make sure that it's referring to _this repository_ and the the parent repository

## QUICK INSTALL AND RUN

### First Install

```
nvm use
npm ci
# create default netcreate.config file
./nc.js --dataset=testproject
```

This will start up the app server. View the webapp by visiting `localhost:3000`. The IP address of the server is reported in console if you need to test from remote computer.

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
* if on a remote, login with a login token and append `?admin=true` to the end of the URL (e.g. `192.168.1.100:3000/#/edit/TEST-TEST-GXK?admin=true`)


## NETCREATE-ITEST (2.0) TARGET FEATURES

_under development_

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