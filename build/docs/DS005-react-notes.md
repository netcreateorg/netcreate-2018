Q. How to make a list in React?
A. Using the ReactStrap ListGroup.
Q. How to convert data to stuff rendered in components?
A. Use the array.map() function, which can be used to return another array of transformed stuff.

Q. What is props.children?
A. It's the contents of invoked component. React favors composition through props and props.children.
<MyComponent attrib1 attrib2>
  <p>the contents inside MyComponent (these p tags)</p>
  <p>are passed as props.children</p>
</MyComponent>

Here's a helpful article:
https://codeburst.io/a-quick-intro-to-reacts-props-children-cb3d2fce4891

So between props childrenand array.map(), have the ability to create the list view.

Q. How do you make something clickable in reactstrap?
A. you pass as onClick, etc attributes (e.g. onClick={this.handlerFunction} )
A. you get a React SyntheticEvent.

Q. Integrated D3 and React Approaches
A. https://medium.com/@tibotiber/4da35f912484 - INFORMATIVE!!!
A. Picking this: https://github.com/Olical/react-faux-dom - allows D3 code to be independent


