## Handling Forms

Q. How to think about Forms and Data Entry
A. Form Element Styling is less important now; we can assume on('event') is our main interface, and I need to look up FLEXBOXES

Q. What is the Javascript Event Declaration Standard?
A. the current best practice is to use these:
   btn.addEventListener('click', function(event) {});
   btn.removeEventListener('click',function);
   btn.dispatchEvent('click',event);
A. See EventTarget interface: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
   these methods apply to certain high level objects.
A. See Event interface: https://developer.mozilla.org/en-US/docs/Web/API/Event

Q. What are the HTML5 Form Elements?
A. here is the canonical list:
   https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form

Q. What about fancier components?
A. catalog - https://github.com/brillout/awesome-react-components
A. List virtualizer - https://react.rocks/example/react-virtualized
A. A solution to rendering large lists is to use "virtualization"
   https://blog.jscrambler.com/optimizing-react-rendering-through-virtualization/






