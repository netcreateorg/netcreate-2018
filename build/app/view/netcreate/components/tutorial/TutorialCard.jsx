/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TutorialCard

  Renders one step of the tutorial: body content + Skip and >/END buttons.
  Stateless — Tutorial.jsx owns the step index and decides what to pass in.

  PROPS
    body        JSX rendered inside the card
    isLast      bool, swaps '>' for 'END'
    position    'center' | 'left' | 'right'
    onSkip      () => void
    onNext      () => void

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');

class TutorialCard extends React.Component {
  render() {
    const { body, isLast, position, onSkip, onNext } = this.props;
    const overlayClass = 'tut-overlay tut-pos-' + (position || 'center');
    return (
      <div className={overlayClass}>
        <div className="tut-card" role="dialog" aria-label="Tutorial step">
          <div className="tut-card-body">{body}</div>
          <div className="tut-buttons">
            {!isLast && (
              <button className="tut-btn" type="button" onClick={onSkip}>
                Skip
              </button>
            )}
            <button
              className={'tut-btn' + (isLast ? ' tut-btn-end' : '')}
              type="button"
              onClick={onNext}
            >
              {isLast ? 'END' : '>'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = TutorialCard;
