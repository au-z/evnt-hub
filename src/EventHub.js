const isObj = (a) => (a === Object(a) && Object.prototype.toString.call(a) !== '[object Array]');

/**
 * Creates an event hub for pub/sub interactions and
 * window.postMessage communication for linking clients.
 * @param {Object} options configuration options for the hub
 * @return {Object} the public API of the EventHub library
 */
export default (function(options) {
	const version = '1.3.1';
	options = options || {};
	let targetOrigin = options.targetOrigin || null;
	const targetWindow = options.targetWindow || null;
	const verbose = options.verbose || false;
	let hubId = options.hubId || null;
	if(!targetOrigin && verbose) {
		console.warn('[EventHub] Cannot postMessage without a targetOrigin. Please add it to \'_init_\' event payload.');
	}
	if(!options.originRegex) console.warn('[EventHub] No originRegex provided. Incoming messages will not be checked.');

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
			if(verbose) console.log(`Subscription to '${event}' added. Returning token: ${token}.`);
			return token;
		}

		/**
		 * Publishes an event to the hub
		 * @param {String} event the event being published
		 * @param {String} payload any data associated with the event
		 * @return {Boolean} if the publish was successfull
		 */
		function publish(event, payload) {
			if(verbose) console.log(`Event ${event} published. Payload: `, payload);
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

	hub.subscribe('_init_', (type, payload = {}) => {
		if(!isObj(payload)) {
			// legacy behavior
			hubId = payload.toString();
		} else {
			hubId = payload.hubId.toString();
			targetOrigin = (payload.targetOrigin) ? payload.targetOrigin : targetOrigin;
			if(!targetOrigin) {
				console.error('[EventHub] No target origin supplied. Cannot postMessage.');
			}
		}
	});
	window.addEventListener('message', function(event) {
		let origin = event.origin || event.originalEvent.origin;
		let ok = isOriginValid(origin);
		if(!ok) {
			console.warn('[EventHub] message received from unknown origin. Ignoring.');
			return;
		}
		if(!event.data || !event.data._type || !event.data.payload) return;
		if(verbose) console.log(`PostMessage event ${event.data._type} received from ${origin}. Publishing.`);
		hub.publish(event.data._type, event.data.payload);
	});

	/**
	 * Returns true if the origin matches the regex or if there is no originRegex configured.
	 * @param {String} origin the origin of the event
	 * @return {Boolean}
	 */
	function isOriginValid(origin) {
		if(!options.originRegex) {
			return true;
		}
		let match = options.originRegex.exec(origin);
		return !!(match);
	}

	/**
	 * Publishes the event and sends a window.postMessage to the targetOrigin
	 * @param {String} _type the event name and type of postMessage
	 * @param {Object} payload the event and postMessage payload
	 * @param {Object} window the window to postMessage to
	 */
	function emit(_type, payload = {}, window) {
		hub.publish(_type, payload);
		post(_type, payload, window);
	}

	/**
	 * Sends a window.postMessage to the targetOrigin
	 * @param {String} _type the type of postMessage
	 * @param {Object} payload the postMessage payload
	 * @param {Object} window the window to postMessage to (fallback: options.targetWindow)
	 */
	function post(_type, payload = {}, window) {
		// use the targetWindow as a fallback
		window = window || targetWindow;
		if(verbose) console.log(`Attempting to postMessage ${_type} to targetOrigin ${targetOrigin}. Payload: `, payload);
		if(window) {
			if(!hubId) console.warn('[EventHub] has no hubId.');
			if(isObj) payload._hubId = hubId;
			targetOrigin && window.postMessage({_type, payload}, targetOrigin);
		} else {
			console.error('[EventHub] cannot postMessage to falsy window.');
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
		about: () => ({
			hubId,
			originRegex: options.originRegex,
			targetOrigin,
			targetWindow,
			verbose,
			version,
		}),
		emit,
		isOriginValid,
		nextTick,
		post,
		publish: hub.publish,
		subscribe: hub.subscribe,
		unsubscribe: hub.unsubscribe,
	};
});
