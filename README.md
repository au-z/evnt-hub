# evnt-hub [![npm version](https://badge.fury.io/js/evnt-hub.svg)](https://badge.fury.io/js/evnt-hub) [![Build Status](https://travis-ci.org/auzmartist/evnt-hub.svg?branch=master)](https://travis-ci.org/auzmartist/evnt-hub)
> A tiny (4 KB) pub sub JS module with added functionality to post messages across iFrame boundaries with window.postMessage.

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
`evnt-hub` has a number of options, all of which are __optional__ and some of which can be set dynamically depending on your use case.

```javascript
let hub = new EventHub({
  targetOrigin: 'http://your.target-origin.here', // the origin you want to send to
  originRegex: /^(https?):\/\/.*(my-domain)(\.com)$/,
  targetWindow: window.parent, // the window to postMessage to
  hubId: -1,
  verbose: true,
});
```
#### targetOrigin:
Specify a targetOrigin to be included as the required origin parameter in a window.postMessage command. If no targetOrigin is provided, one will need to be provided in an '\_init\_' event to the hub. If no targetOrigin is present during a call to emit a postMessage, the postMessage will not send.
#### originRegex:
The originRegex option allows the hub to accept messages from multiple domains for multi-domain eventing.
If not present, the origin checker will not run. __WARNING:__ Dependening on your application, this may pose a security risk. See below for security considerations.
#### targetWindow:
Specify a targetWindow to configure the window to which you will send postMessages. This setting can be overridden by the emit function's 'window' argument. If no targetWindow is provided at postMessage time, no postMessage will be sent.
#### hubId:
In order to disambiguate which hub sends which message, hubId, if present, will be tacked on to every outbound postMessage Object payload. A hubId can optionally be set via an '\_init\_' postMessage. __hubId__ is not added to the 
#### verbose:
If true, triggers console.logs on every subscribe, publish, emit, and postMessage receive. __Note:__ A single publish may trigger multiple event handler functions, however verbose logging will only log once.

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

## Contributing
Make sure to run the tests and build the lib folder (dev and build scripts) before committing and submitting a pull request. For your convenience, a `prepublish` script can be run to accomplish all three tasks.

```bash
npm run prepublish
```
