/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Optimized Markdwon React Component

  This is based on Joshua's implementation of Markdown React in NodeTable
  and EdgeTable.

  Wraps the MDReactComponent and only updates when the text changes.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const MDReactComponent = require('markdown-react-js');
const mdEmoji = require('markdown-it-emoji');
const React = require('react');
const UNISYS = require('unisys/client');

/// COMPONENT DECLARATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MarkdownNote extends UNISYS.Component {
  constructor() {
    super();
    this.markdownIterate = this.markdownIterate.bind(this);
  }

  markdownIterate(Tag, props, children) {
    if (Tag === 'a') {
      props.target = '_blank';
    }
    return <Tag {...props}>{children}</Tag>;
  }

  shouldComponentUpdate(np, ns) {
    let bReturn = true;
    if (this.text === np.text) bReturn = false;
    else this.text = np.text;
    return bReturn;
  }

  render() {
    const { text } = this.props;
    return (
      <MDReactComponent
        text={text}
        onIterate={this.markdownIterate}
        markdownOptions={{ typographer: true, linkify: true }}
        plugins={[mdEmoji]}
      />
    );
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MarkdownNote;
