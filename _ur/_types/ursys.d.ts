/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS library types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/* added for pull request #81 so 'npm run lint' test appears clean */
/* eslint-disable no-unused-vars */

/// MAIN SERVER LIBRARY ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used for runtime initialization of the server-side URSYS library */
type UR_InitOptions = {
  rootDir: string;
};
