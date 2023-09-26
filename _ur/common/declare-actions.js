/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  All declare modules are dependency-free so can be imported by anyone

  This is a set of names that you can use to name functions descriptively.
  (WIP) will update as module APIs are further defined.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/* added for pull request #81 so 'npm run lint' test appears clean */
/* eslint-disable no-unused-vars */

/// KINDS OF OPERATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const OP_TYPES = {
  // code execution
  set: ['set', 'assign', 'define', 'declare', 'create', 'make', 'new'],
  get: ['get', 'fetch', 'read', 'retrieve', 'lookup', 'find', 'search'],

  runtime: ['run', 'exec', 'execute', 'eval', 'interpret'],
  call_immediate: ['call', 'invoke', 'execute', 'run'],
  call_async: ['await', 'async', 'promise', 'callback', 'then', 'catch'],
  call_pubsub: ['subscribe', 'publish', 'post', 'unsubscribe', 'notify'],
  events: ['emit', 'on', 'off', 'listen', 'trigger', 'dispatch'],

  queue: ['queue', 'enqueue', 'dequeue', 'push', 'pop', 'shift', 'unshift'],
  stack: ['stack', 'push', 'pop', 'shift', 'unshift'],

  sequence: ['sequence', 'series', 'chain', 'pipe', 'compose', 'flow'],
  stream: ['open', 'close', 'read', 'write'],
  prototcol: ['encode', 'decode', 'serialize', 'deserialize'],

  network: ['connect', 'disconnect', 'send', 'receive', 'ping', 'pong'],

  file: ['open', 'close', 'read', 'write', 'save', 'load', 'import', 'export'],
  derived: ['derive', 'calculate', 'compute', 'generate', 'transform'],
  allocate: ['allocate', 'deallocate', 'reserve', 'release'],

  database: ['connect', 'disconnect', 'query', 'update', 'insert', 'delete'],
  collection: ['add', 'remove', 'update', 'clear', 'list'],
  query: ['find', 'search', 'list', 'count', 'exists'],

  resource: ['allocate', 'deallocate', 'reserve', 'release'],
  registry: ['register', 'unregister', 'lookup', 'list'],

  transaction: ['begin', 'commit', 'rollback'],
  session: ['login', 'logout', 'authenticate', 'authorize'],

  error: ['throw', '  catch', 'handle', 'log', 'report']
};
