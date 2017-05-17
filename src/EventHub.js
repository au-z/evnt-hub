/* eslint-disable no-console */
/**
 * Creates an event hub for pub/sub interactions and
 * window.postMessage communication for linking clients.
 * @param {Object} options configuration options for the hub
 * @return {Object} the public API of the EventHub library
 */
export default (function(options) {
	const version = '1.0.3';
	options = options || {};
	if(!options.targetOrigin) console.error('[EventHub] targetOrigin not provided.');
	if(!options.originRegex) console.error('[EventHub] originRegex not provided.');
	let hubId = null;
	let nextTickFn = function(){};

	const hub = (function(q) {
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
				}
				nextTickFn();
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
							return token;
						}
					}
				}
			}
			return false;
		}

		return {subscribe, publish, unsubscribe};
	})();

	hub.subscribe('_init_', (type, payload) => {
		hubId = payload.toString();
	});
	window.addEventListener('message', function(event) {
		let origin = event.origin || event.originalEvent.origin;
		let ok = isOriginValid(origin);
		if(!ok) {
			console.warn('[EventHub] message received from unknown origin. Ignoring.');
			return;
		}
		if(!event.data || !event.data._type || !event.data.payload) {
			console.error('[EventHub] No type or payload sent with message data');
		}
		hub.publish(event.data._type, event.data.payload);
	});

	/**
	 * Returns true if the origin matches the regex
	 * @param {String} origin the origin of the event
	 * @return {Boolean}
	 */
	function isOriginValid(origin) {
		let match = options.originRegex.exec(origin);
		return !!(match);
	}

	/**
	 * Publishes the event and sends a window.postMessage to the targetOrigin
	 * @param {String} _type the event name and type of postMessage
	 * @param {Object} payload the event and postMessage payload
	 */
	function emit(_type, payload = {}) {
		hub.publish(_type, payload);
		post(_type, payload);
	}

	/**
	 * Sends a window.postMessage to the targetOrigin
	 * @param {String} _type the type of postMessage
	 * @param {Object} payload the postMessage payload
	 */
	function post(_type, payload = {}) {
		if(window.parent) {
		if(!hubId) console.warn('[EventHub] no hubId provided.');
		payload._hubId = hubId;
			window.parent.postMessage({_type, payload}, options.targetOrigin);
		}
	}

	/**
	 * Registers a function to be run after all subscription funcs are called
	 * @param {Function} cb the callback function to execute
	 */
	function nextTick(cb) {
		nextTickFn = cb;
	}

	return {
		version,
		emit,
		nextTick,
		isOriginValid,
		publish: hub.publish,
		subscribe: hub.subscribe,
		unsubscribe: hub.unsubscribe,
	};
});
