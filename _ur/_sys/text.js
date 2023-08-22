/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  description

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PARSER INPUT NORMALIZER ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This function takes a multi-line string and performs the following operations:
 *  - Makes sure all newline types with '\n'
 *  - Removes all tab characters
 *  - Processes comma and colon delimited sequences in each line:
 *  - Removes whitespace around each delimiter except when inside quotes
 *  - Collapses all internal whitespace to a single space
 *  - Ensures that there is a trailing newline
 * (written, with effort, by ChatGPT4)
 * @param {string} str - The input string to be normalized.
 * @return {string} - The normalized string.
 */
function PreprocessDataText(str) {
  let normalizedStr = str.replace(/\r\n|\r/g, '\n'); // conform newlines
  normalizedStr = normalizedStr // remove trailing/preserve leading whitespace
    .split('\n')
    .map(line => line.replace(/\s+$/, '')) // remove trailing
    .map(line => line.replace(/^\s+/, '')) // remove leading
    .join('\n');
  normalizedStr = normalizedStr.replace(/\t/g, '  '); // replace tabs with 2 spaces
  let lines = normalizedStr.split('\n'); // split string into lines
  /** process whitespace around delimiters */
  const processDelimited = (line, delimiter) => {
    let parts = line.split(delimiter); // split lines based on delimiter
    for (let i = 0; i < parts.length; i++) {
      parts[i] = parts[i].trim();
      parts[i] = parts[i].replace(/\s+/g, ' ');
    }
    return parts.join(delimiter);
  };
  for (let i = 0; i < lines.length; i++) {
    lines[i] = processDelimited(lines[i], ',', { preserve: true });
    lines[i] = processDelimited(lines[i], ':', { preserve: true });
  }
  normalizedStr = lines.join('\n').trim();
  return normalizedStr + '\n';
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PreprocessDataText
};
