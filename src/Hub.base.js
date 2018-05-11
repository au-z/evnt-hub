/**
 * Creates a simple pub sub object to which an application can subscribe, publish, and unsubscribe.
 * @param {Object} options hub options
 * @return {Object} the basic hub api
 */
export default function Hub(options = {}) {
  const DEBUG = !!(options.debugFn);
  let nextTickFn;
  let events = {};
  let subUid = -1;
  /**
   * Subscribe to an event in the hub
   * @param {String} event the event being listened for
   * @param {Function} func the function to execute on publish
   * @return {String} a token identifying the subscription
   */
  function subscribe(event, func = function(){}) {
    if(!events[event]) events[event] = [];
    let token = (++subUid).toString();
    events[event].push({token, func});
    DEBUG && console.log(`Subscription to '${event}' added. Returning token: ${token}.`);
    return token;
  }

  /**
   * Publishes an event to the hub
   * @param {String} event the event being published
   * @param {String} payload any data associated with the event
   * @return {Boolean} if the publish was successfull
   */
  function publish(event, payload) {
    if(!events[event]) return false;
    setTimeout(() => {
      let subscribers = events[event];
      let len = subscribers ? subscribers.length : 0;
      while(len--) {
        subscribers[len].func(event, payload);
        DEBUG && options.debugFn(event, payload);
      }
      nextTickFn && nextTickFn();
    }, 0);
    return true;
  }

  /**
   * Unsubscribes from events published to the hub with the matching token
   * @param {String} token the subscription identifier issued on subscribe
   * @return {Number|Boolean} the token if successful else false
   */
  function unsubscribe(token) {
    for(let e in events) {
      if(events[e]) {
        for(let i = 0; i < events[e].length; i++) {
          if(events[e][i].token === token) {
            events[e].splice(i, 1);
            DEBUG && console.log(`[EventHub] Unsubscribed token ${token}.`);
            return token;
          }
        }
      }
    }
    return false;
  }

  /**
   * Sets a next tick function to execute after an event is processed
   * @param {Function} cb the function to execute on next tick
   */
  function nextTick(cb) {
    nextTickFn = cb;
  }

  return {subscribe, publish, unsubscribe, nextTick};
}
