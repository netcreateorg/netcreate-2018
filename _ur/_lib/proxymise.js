/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  proxymise - by Ilya Kozhevnikov
  https://github.com/kozhevnikov/proxymise
  see proxymise-readme.md for more information about the source

  This library implements an wrapper that will convert an object of properties
  and methods into something that can be chained (i.e a "fluent API"), even if
  the methods are asynchronous!

  const proxymise = require('proxymise');

  // Instead of thens
  foo.then(value => value.bar())
    .then(value => value.baz())
    .then(value => value.qux)
    .then(value => console.log(value));

  // Instead of awaits
  const value1 = await foo;
  const value2 = await value1.bar();
  const value3 = await value2.baz();
  const value4 = await value3.qux;
  console.log(value4);

  // Use proxymise
  const value = await proxymise(foo).bar().baz().qux;
  console.log(value);

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const proxymise = target => {
  if (typeof target === 'object') {
    const proxy = () => target;
    proxy.__proxy__ = true;
    return new Proxy(proxy, handler);
  }
  return typeof target === 'function' ? new Proxy(target, handler) : target;
};

const handler = {
  construct(target, argumentsList) {
    if (target.__proxy__) target = target();
    return proxymise(Reflect.construct(target, argumentsList));
  },

  get(target, property, receiver) {
    if (target.__proxy__) target = target();
    if (
      property !== 'then' &&
      property !== 'catch' &&
      typeof target.then === 'function'
    ) {
      return proxymise(target.then(value => get(value, property, receiver)));
    }
    return proxymise(get(target, property, receiver));
  },

  apply(target, thisArg, argumentsList) {
    if (target.__proxy__) target = target();
    if (typeof target.then === 'function') {
      return proxymise(
        target.then(value => Reflect.apply(value, thisArg, argumentsList))
      );
    }
    return proxymise(Reflect.apply(target, thisArg, argumentsList));
  }
};

const get = (target, property, receiver) => {
  const value =
    typeof target === 'object'
      ? Reflect.get(target, property, receiver)
      : target[property];
  if (typeof value === 'function' && typeof value.bind === 'function') {
    return Object.assign(value.bind(target), value);
  }
  return value;
};

module.exports = proxymise;
