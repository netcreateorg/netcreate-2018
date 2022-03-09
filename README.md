## PROJECT SUMMARY

NetCreate 2018 is a network graph analysis tool for researching reading comprehension in the digital humanities classroom. This is a work in progress. See the [NetCreate Wiki](https://github.com/netcreateorg/netcreate-2018/wiki) for additional documentation.

## CITATION

If you use or refer to Net.Create in a publication, we ask that you cite it. The correct citation is: Craig, K. & Danish, J. (2018). Net.Create. http://www.netcreate.org. Indiana University, IN.

## QUICK INSTALLATION

The Wiki has [detailed instructions](https://github.com/netcreateorg/netcreate-2018/wiki/Installation-Guide). In general, you'll need to install the prerequisite `Git` and `NodeJS` (as of 7/29/2020 the officially supported version of Node is version 10.22.0) command line utilities to your computer and use a `terminal` program to issue the following commands to install from the Internet:

* `git clone https://github.com/netcreateorg/netcreate-2018.git`
* `cd netcreate-2018/build`
* `git checkout dev`
* `npm ci`

This will get NetCreate installed and ready to run. It may take some time for the `npm ci` command to finish installing, so be patient!

The first time you run Net.Create, you also need to create a `net-create.config` file.  This will tell Net.Create which dataset to open and which ports to use.  We have a script that can do this for you.  Run:
* `./nc.js --dataset=demo` -- where `demo` will be the name of the dataset you want to use.

## QUICK OPERATION GUIDE

Once you have NetCreate installed, make sure you are in the `netcreate-2018/build` directory. From there, you can execute **scripts** through the `npm` tool that is installed as part of NodeJS. 

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




