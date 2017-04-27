# evnt-hub [![npm version](https://badge.fury.io/js/evnt-hub.svg)](https://badge.fury.io/js/evnt-hub) [![Build Status](https://travis-ci.org/auzmartist/evnt-hub.svg?branch=master)](https://travis-ci.org/auzmartist/evnt-hub)
> A tiny (3 KB) pub sub JS module with added functionality to post messages across iFrame boundaries with window.postMessage.

## Dependencies
None. **evnt-hub's** postMessage features are [well supported](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Browser_compatibility).

## Installation
```bash
npm i --save evnt-hub
```
```html
<script src="node_modules/evnt-hub/lib/EventHub.min.js"></script>
```

## Getting Started
In order to post messages to host window using window.postMessage,
you will need to know the origin of the host.
```javascript
let hub = new EventHub({
  targetOrigin: 'http://your.target-origin.here',
});
```
**evnt-hub** is implemented with best practices in mind regarding XSS exposure. For more information on window.postMessage and the security concerns associated
with cross origin messaging, check out the [MDN documentation.](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

Further features are under consideration regarding the use of '**\***' to publish messages from all hosts.

## Development Setup
```bash
npm install
npm run dev
npm run dev:demo
npm run build
npm run test
npm run test:watch
```