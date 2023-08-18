/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  All declare modules are dependency-free so can be imported by anyone

  We want to define several kinds of data streams that can be passed
  between modules. Currently we'll use either JSON or our upcoming
  "ursys exchange format".

  PLACEHOLDER WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// MEDIA FORMATS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are supported known file types, added as we expand our system to
/// support them. Here are some placeholders
const MEDIA_TYPES = {
  PNG: {}, // buffer
  GIF: {}, // buffer
  JPG: {}, // buffer
  WEBP: {}, // buffer
  TXT: {}, // lines (text)
  MD: {}, // lines (markdown)
  SVG: {} // lines (xml)
};

/// EVENT STREAMS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const EVENT_TYPES = {
  DOM_EVENT: {},
  CUSTOM_EVENT: {}
};

/// APPDATA DOCUMENTS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// The stream types are the kinds of data we expect to pass around in our
/// applications. There is a MAIN TYPE which can contain various optional
/// subtypes.
const APPDATA_TYPES = {
  // PTRACK-style data from STEP projects
  PTRK: {},
  // URSYS system channels
  UR: {
    UNET: {}, // message traffic
    UCTRL: {}, // controller I/O
    VOBJ: {}, // display list (visual) objects
    DOBJ: {}, // simulation or pure data objects
    LOG: {} // log data
  },
  // appplication file formats
  DOC: {
    // ursys tagged section interchange format
    UEXF: {
      GRAPH: {} // netgraph data
    }
  },
  // netcreate-specific data
  NC: {}
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  APPDATA_TYPES,
  MEDIA_TYPES,
  EVENT_TYPES
};
