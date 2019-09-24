# evnt-hub [![npm version](https://badge.fury.io/js/evnt-hub.svg)](https://badge.fury.io/js/evnt-hub) [![Build Status](https://travis-ci.org/auzmartist/evnt-hub.svg?branch=master)](https://travis-ci.org/auzmartist/evnt-hub)
> A tiny (6 KB) pub sub JS module with added functionality to post messages across iFrame boundaries with window.postMessage.

## Dependencies
None. **evnt-hub's** postMessage features are [well supported](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Browser_compatibility).

Some features of evnt-hub require Promise support. Be aware that [not all browsers support this features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Browser_compatibility)

## Installation
```bash
npm install --save evnt-hub
```

```html
<script src="https://unpkg.com/evnt-hub@2.0.0/lib/EventHub.min.js" async defer></script>
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
#### verbose (deprecated): 
This boolean no longer triggers a debugging mode. See debugFn below.
#### debugFn:
If passed, debug mode is activated which triggers log messages on every subscribe, publish callback, emit, and postMessage received.
The passed function is run for each publish callback allowing the user to hook into the payload data for logging or auditing purposes. Other debugging messages are not configurable.

## Methods

### subscribe
> Subscribes to an event in the hub. When the event is published, `func` will be executed. Returns a token identifying the subscription.
```javascript
hub.subscribe('event', func, correlationId)
```
- **event** the event being listened for
- **func** the function to execute on publish
- **correlationId** _(optional)_ a unique token to correlate sent and received events

### publish
> Publishes an event to the hub. When the event is received in the hub, all subscriptions to that event are processed. Returns true if any relevant subscriptions exist.
```javascript
hub.publish('event', payload, correlationId)
```
- **event** the event being published
- **payload** any data associated with the event
- **correlationId** _(optional)_ a unique token to correlate sent and received events

### unsubscribe
> Unsubscribes from the hub. Returns the token if successful, otherwise `false`.
```javascript
hub.unsubscribe(token)
```

### subscribeOnce
> Subscribes to an event in the hub. When an event with a matching correlationId is published, `func` will be executed and auto-unsubscribed.
```javascript
hub.subscribeOnce('event', func, correlationId)
```
- **event** the event being listened for
- **func** the function to execute on publish
- **correlationId** a unique token to correlate sent and received events

### post
> Sends a window.postMessage to the targetOrigin to be published on that window's hub.
```javascript
hub.post('event', payload, window, correlationId)
```
- **event** the event being published
- **payload** any data associated with the event
- **window** _(optional)_ the window to post the message to. Defaults to the targetWindow.
- **correlationId** _(optional)_ a unique token to correlate sent and received events

### emit
> Combines publish and post functionality.
```javascript
hub.emit('event', payload, window, correlationId)
```
- **event** the event being published
- **payload** any data associated with the event
- **window** _(optional)_ the window to post the message to. Defaults to the targetWindow.
- **correlationId** _(optional)_ a unique token to correlate sent and received events

### request
> Returns a promise that resolves whenever the supplied event is received in response. Requests are `emit`ted - published locally and sent to the targetWindow.
```javascript
hub.request('requestEvent', 'responseEvent', requestBody)
  .then((response) => {
    response.value; // response payload
    response._meta; // meta information about the published response event
  });
```
- **reqEvent** the event being emitted
- **reqEvent** the event being subscribed to
- **reqBody** any data to be sent in the request payload
- **correlationId** _(optional)_ a unique token to correlate sent and received events

### requestOnce
> Returns a promise that resolves only when the supplied event is received in response and the correlationIds match. Requests are `emit`ted - published locally and sent to the targetWindow. Like `subscribeOnce`, the subscription is auto-unsubscribed.
```javascript
hub.request('requestEvent', 'responseEvent', requestBody, correlationId)
  .then((response) => {
    response.value; // response payload
    response._meta; // meta information about the published response event
  });
```
- **reqEvent** the event being emitted
- **reqEvent** the event being subscribed to
- **reqBody** any data to be sent in the request payload
- **correlationId** a unique token to correlate sent and received events

### about
> Returns the hub configuration.
```javascript
hub.about() // {hubId: -1, targetOrigin: http://localhost, ...}
```

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
