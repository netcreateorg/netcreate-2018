/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TutorialWelcome

  First-run modal asking the user whether they want the guided tour.
  Centered card, dark blue stroke; matches the prototype's first screen.

  PROPS
    onYes  () => void   start the walkthrough
    onNo   () => void   dismiss and persist that decision

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');

class TutorialWelcome extends React.Component {
  render() {
    const { onYes, onNo } = this.props;
    return (
      <div className="tut-overlay tut-pos-center">
        <div className="tut-welcome" role="dialog" aria-label="Tutorial welcome">
          <h2>
            Welcome to <span className="tut-hl">N</span>et.Create
          </h2>
          <p>Would you like a tutorial?</p>
          <div className="tut-buttons">
            <button className="tut-btn" type="button" onClick={onYes}>
              Yes
            </button>
            <button className="tut-btn" type="button" onClick={onNo}>
              No
            </button>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = TutorialWelcome;
