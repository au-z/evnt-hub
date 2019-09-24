interface SubscriptionOptions {
  correlationId: string | null
}

interface Subscription {
  token: string
  func: Function
  options: SubscriptionOptions
}

/**
 * Creates a simple pub sub object to which an application can subscribe, publish, and unsubscribe.
 * @param {boolean} options hub options
 * @return {Object} the basic hub api
 */
export default function Hub(verbose: boolean) {
  const VERBOSE = verbose;
  let nextTickFn: Function = () => {};
  let eventMap: {[index: string] : Subscription[]} = {};
  let subUid = -1;

  /**
   * Subscribe to an event in the hub
   * @param {String} event the event being listened for
   * @param {Function} func the function to execute on publish
   * @param {String} correlationId a unique token to correlate sent and received events
   * @return {String} a token identifying the subscription
   */
  function subscribe(event: string, func: Function = () => {}, correlationId: string | null = null) {
    if(!eventMap[event]) eventMap[event] = [];
    let token = (++subUid).toString();
    eventMap[event].push({token, func, options: {correlationId}});
    VERBOSE && console.log(`Subscription to '${event}' added. Returning token: ${token}.`);
    return token;
  }

  /**
   * Publishes an event to the hub
   * @param {String} event the event being published
   * @param {String} payload any data associated with the event
   * @param {String} correlationId a unique token to correlate sent and received events
   * @return {Boolean} if the publish was successfull
   */
  function publish(event: string, payload: any, correlationId: string) {
    VERBOSE && console.log(`Event '${event}' published. Payload: `, payload);
    if(!eventMap[event]) return false;
    setTimeout(() => {
      const subscribers = eventMap[event];
      let idx = subscribers.length;
      while(idx--) {
        subscribers[idx].func(event, payload, {
          correlationId: correlationId,
          correlates: correlationId === subscribers[idx].options.correlationId,
        });
      }
      nextTickFn();
    }, 0);
    return true;
  }

  /**
   * Unsubscribes from eventMap published to the hub with the matching token
   * @param {String} token the subscription identifier issued on subscribe
   * @return {Number} the token if successful else false
   */
  function unsubscribe(token: string) {
    let found = false;
    Object.values(eventMap).forEach((subscriptions) => {
      const idx = subscriptions.findIndex((s) => s.token === token)
      if(idx > -1) {
        subscriptions.splice(idx, 1);
        found = true;
      }
    })
    return found ? token : false;
  }

  /**
   * Registers a function to be run after all subscription funcs are called
   * @param {Function} cb the callback function to execute
   */
  function nextTick(cb: Function) {
    nextTickFn = cb;
  }

  return {
    subscribe,
    publish,
    unsubscribe,
    nextTick,
  };
};