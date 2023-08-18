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
  PNG: {},
  GIF: {},
  TXT: {},
  MD: {},
  SVG: {}
};

/// DATA STREAMS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// The stream types are the kinds of data we expect to pass around.
/// There is a MAIN TYPE which can contain various optional subtypes.
const STREAM_TYPES = {
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
  // file formats
  DOC: {
    // ursys tagged section interchange format
    UEXF: {
      GRAPH: {} // netgraph data
    },
    ...MEDIA_TYPES
  },
  // netcreate-specific data
  NC: {}
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  STREAM_TYPES
};
