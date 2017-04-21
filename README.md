# event-hub
> A tiny (3 KB) pub sub JS module with added functionality to post messages across iFrame boundaries with window.postMessage.

## Dependencies
None. **event-hub's** postMessage features are [well supported](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Browser_compatibility).

## Installation
```bash
npm i --save event-hub
```
```html
<script src="node_modules/event-hub/lib/EventHub.min.js"></script>
```

## Getting Started
In order to post messages to host window using window.postMessage,
you will need to know the origin of the host. 
```javascript
let hub = new EventHub({
  targetOrigin: 'http://your.target-origin.here',
});
```
**event-hub** is implemented with best practices in mind regarding XSS exposure. For more information on window.postMessage and the security concerns associated
with cross origin messaging, check out the [MDN documentation.](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

Further features are under consideration regarding the use of '**\***' to publish messages from all hosts.

## Development Setup
```bash
npm install
npm run dev
npm run build
npm run test
npm run test:watch
```