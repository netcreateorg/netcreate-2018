## PROJECT SUMMARY

NetCreate 2018 is a network graph analysis tool for researching reading comprehension in the digital humanities classroom. This is a work in progress. See the [NetCreate Wiki](https://github.com/daveseah/netcreate-2018/wiki) for additional documentation.

## QUICK INSTALLATION

The Wiki has [detailed instructions](https://github.com/daveseah/netcreate-2018/wiki/Installation-Guide). In general, you'll need to install the prerequisite `Git` and `NodeJS` command line utilities to your computer and use a `terminal` program to issue the following commands to install from the Internet:

* `git clone https://github.com/daveseah/netcreate-2018.git`
* `cd netcreate-2018/build`
* `git checkout dev`
* `npm ci`

This will get NetCreate installed and ready to run. It may take some time for the `npm ci` command to finish installing, so be patient!

## QUICK OPERATION GUIDE

Once you have NetCreate installed, make sure you are in the `netcreate-2018/build` directory. From there, you can execute **scripts** through the `npm` tool that is installed as part of NodeJS. 

You will be using these commands most frequently:

* `npm run dev` - Run the NetCreate Server in developer mode. This is the mode that most people use the most. The terminal will print status and instructions on how to connect to the NetCreate Server with the Chrome browser.
* `npm run log` - While NetCreate is running, use another terminal window to print the contents of the current **session log**. You can use this to monitor the activity of the running server.
* `npm run package` - After a NetCreate classroom session, use this command to make a snapshot of the current database and placed in the `netcreate-2018/build/public` directory. You can copy this directory to a webserver for read-only access to the netgraph!

## SUPPORT OPERATIONS

To generate **access keys** for groups, there is a utility accessible from the **javascript console** of a browser that's running the NetCreate app. 

* Open the javascript console (in MacOS Chrome, COMMAND-OPTION-J will open it)
* Type `ncMakeTokens('class','project',10) to create 10 **group access keys** that can be used to connect to the application. This list can be generated ahead-of-time and assigned during class. These keys are logged by the server for every action so you can recreate what the students are doing.
* Students within a group and append a string of the form `-ID<#>`, where # is a positive integer to uniquely identify their computer. They can tell the teacher which ID they used.

To **erase the database**, another javascript console command `ncEmptyDatabase()` will erase the server database. You may have to issue the command twice for it to take hold. Then refresh the browser and see if the database was erased.

All **session logs** are stored in `netcreate-2018/build/runtime/logs`.

The **server database** is stored in `netcreate-2018/build/runtime/netcreate.loki`. You can copy this file to archive it.




