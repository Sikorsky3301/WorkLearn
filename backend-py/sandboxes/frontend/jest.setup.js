// jest-environment-jsdom's sandboxed global omits Node's TextEncoder/
// TextDecoder, which the `jsdom` package (used directly by task specs that
// need to execute a submission's inline <script> via runScripts:
// 'dangerously') needs transitively through whatwg-url. Polyfill from Node's
// real `util` module before any test file runs.
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
