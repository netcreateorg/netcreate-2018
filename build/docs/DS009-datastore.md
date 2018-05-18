## Data Module Stuff

- - -
Q. How to load the data? What does it look like anyway?
A. Currently it's a json file in htmldemo. It's just a bunch of properties. I'm going to remove the ones that are visual coding related (color, xy, etc)

{
  {
      "label" : "Walter Wyman",
      "id"    : "129",
      "attributes": {
        "Node_Type"         : "Person",
        "Modularity Class"  : "42",
        "Extra Info"        : "1897",
        "Notes" : "published influential report,1897  argued that pestis bacteria traveled person to person  "
      }
  },
  ...
}

- - -
SIDE NOTE: Because the attributes are likely to change, this makes me think that I want to avoid using a relational database and use an object store instead. MongoDB seems to be the hotness, so we'll use that. It's also possible to use a pure NodeJS based approach, which might be convenient since it won't require installing an additional daemon, but the advantage of using MongoDB is that Kalani can do her own queries on it. That is probably useful. We'll explore using a Node-based NoSQL database (e.g. NoSQL on npm) just for local settings.

For now, we'll implement just a data module that loads an arbitrary json file.

- - -
Q. Where do we load the system/datastore module?
A. For our React primary view, this is routed by init-appshell.jsx into view/prototype/Prototype.jsx. We don't yet have a module initialization convention, so it's time to define one.





