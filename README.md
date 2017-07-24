# evnt-hub [![npm version](https://badge.fury.io/js/evnt-hub.svg)](https://badge.fury.io/js/evnt-hub) [![Build Status](https://travis-ci.org/auzmartist/evnt-hub.svg?branch=master)](https://travis-ci.org/auzmartist/evnt-hub)
> A tiny (3 KB) pub sub JS module with added functionality to post messages across iFrame boundaries with window.postMessage.

## Dependencies
None. **evnt-hub's** postMessage features are [well supported](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Browser_compatibility).

## Installation
```bash
yarn add evnt-hub --save
```
```html
<script src="node_modules/evnt-hub/lib/EventHub.min.js"></script>
```

## Getting Started
In order to post messages to host window using window.postMessage,
you will need to know the origin of the host.
```javascript
let hub = new EventHub({
  targetOrigin: 'http://your.target-origin.here', // the origin you want to send to
  originRegex: /^(https?):\/\/.*(my-domain)(\.com)$/,
  targetWindow: window.parent, // the window to postMessage to
  hubId: -1,
});
```
#### targetOrigin:
Specify a targetOrigin to be included as the required origin parameter in a window.postMessage command.
#### originRegex (optional):
The originRegex option allows the hub to accept messages from multiple domains for multi-domain eventing.
If not present, the origin checker will not run. __WARNING:__ Dependening on your application, this may pose a security risk. See below for security considerations.
#### targetWindow (optional):
Specify a targetWindow to configure the window to which you will send postMessages. This setting can be overridden by the emit function's 'window' argument. If no targetWindow is provided at postMessage time, no postMessage will be sent.
#### hubId (optional):
In order to disambiguate which hub sends which message, hubId, if present, will be tacked on to every outbound postMessage Object payload. A hubId can optionally be set via an '_init_' postMessage. 

## Security
**evnt-hub** is implemented with best practices in mind regarding XSS exposure. For more information on window.postMessage and the security concerns associated
with cross origin messaging, check out the [MDN documentation.](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

## Development Setup
```bash
npm install
npm run dev
# run a dev server at localhost:8100
npm run dev:demo
npm run build
npm run test
npm run test:watch
```
