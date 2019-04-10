const isObj = (a: any) => (a === Object(a) && Object.prototype.toString.call(a) !== '[object Array]');

interface HubOptions {
	targetWindow?: string
	targetOrigin?: string
	originRegex?: RegExp
	hubId?: string
	verbose: boolean
}

interface Subscription {
	token: string
	func: Function
}

/**
 * Creates an event hub for pub/sub interactions and
 * window.postMessage communication for linking clients.
 * @param {Object} options configuration options for the hub
 * @return {Object} the public API of the EventHub library
 */
export default (function(options: HubOptions = {verbose: false}) {
	const targetWindow = options.targetWindow || null;
	const VERBOSE = options.verbose;
	let targetOrigin = options.targetOrigin || null;
	let hubId = options.hubId || null;

	if(!targetOrigin && VERBOSE) {
		console.warn('[EventHub] Cannot postMessage without a targetOrigin. Please add it to \'_init_\' event payload.');
	}
	if(!options.originRegex) {
		console.warn('[EventHub] No originRegex provided. Incoming messages will not be checked.');
	}

	let nextTickFn: Function = function(){};

	const hub = (function() {
		let eventMap: {[index: string] : Subscription[]} = {};
		let subUid = -1;

		/**
		 * Subscribe to an event in the hub
		 * @param {String} event the event being listened for
		 * @param {Function} func the function to execute on publish
		 * @return {String} a token identifying the subscription
		 */
		function subscribe(event: string, func: Function = function(){}) {
			if(!eventMap[event]) eventMap[event] = [];
			let token = (++subUid).toString();
			eventMap[event].push({token, func});
			VERBOSE && console.log(`Subscription to '${event}' added. Returning token: ${token}.`);
			return token;
		}

		/**
		 * Publishes an event to the hub
		 * @param {String} event the event being published
		 * @param {String} payload any data associated with the event
		 * @return {Boolean} if the publish was successfull
		 */
		function publish(event: string, payload: any) {
			VERBOSE && console.log(`Event ${event} published. Payload: `, payload);
			if(!eventMap[event]) return false;
			setTimeout(() => {
				const subscribers = eventMap[event];
				let idx = subscribers.length;
				while(idx--) {
					subscribers[idx].func(event, payload);
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

		return {
			subscribe,
			publish,
			unsubscribe
		};
	})();

	hub.subscribe('_init_', (type: string, payload: any = {}) => {
		hubId = payload.hubId.toString();
		targetOrigin = (payload.targetOrigin) ? payload.targetOrigin : targetOrigin;
		if(!targetOrigin) {
			console.error('[EventHub] No target origin supplied. Cannot postMessage.');
		}
	});

	window.addEventListener('message', (event) => {
		let origin = event.origin || (event as any).originalEvent.origin;
		let ok = isOriginValid(origin);
		if(!ok) {
			console.warn('[EventHub] message received from unknown origin. Ignoring.');
			return;
		}
		if(!event.data || !event.data._type || !event.data.payload) return;
		VERBOSE && console.log(`PostMessage event ${event.data._type} received from ${origin}. Publishing.`);
		hub.publish(event.data._type, event.data.payload);
	});

	/**
	 * Returns true if the origin matches the regex or if there is no originRegex configured.
	 * @param {String} origin the origin of the event
	 * @return {Boolean}
	 */
	function isOriginValid(origin: string) {
		if(!options.originRegex) {
			return true;
		}
		return !!options.originRegex.exec(origin);
	}

	/**
	 * Publishes the event and sends a window.postMessage to the targetOrigin
	 * @param {string} type the event name and type of postMessage
	 * @param {any} payload the event and postMessage payload
	 * @param {Window} window the window to postMessage to
	 */
	function emit(type: string, payload: any = {}, window: Window) {
		hub.publish(type, payload);
		post(type, payload, window);
	}

	/**
	 * Sends a window.postMessage to the targetOrigin
	 * @param {string} type the type of postMessage
	 * @param {any} payload the postMessage payload
	 * @param {Window} window the window to postMessage to (fallback: options.targetWindow)
	 */
	function post(type: string, payload: any = {}, window: Window) {
		// use the targetWindow as a fallback
		window = window || targetWindow;
		VERBOSE && console.log(`Attempting to postMessage ${type} to targetOrigin ${targetOrigin}. Payload: `, payload);
		if(window) {
			if(!hubId) console.warn('[EventHub] has no hubId.');
			if(isObj) payload._hubId = hubId;
			targetOrigin && window.postMessage({type, payload}, targetOrigin);
		} else {
			console.error('[EventHub] cannot postMessage to falsy window.');
		}
	}

	/**
	 * Registers a function to be run after all subscription funcs are called
	 * @param {Function} cb the callback function to execute
	 */
	function nextTick(cb: Function) {
		nextTickFn = cb;
	}

	return {
		about: () => ({
			hubId,
			originRegex: options.originRegex,
			targetOrigin,
			targetWindow,
			verbose: VERBOSE,
			version: '2.0.0',
		}),
		emit,
		post,
		publish: hub.publish,
		subscribe: hub.subscribe,
		unsubscribe: hub.unsubscribe,
		isOriginValid,
		nextTick,
	};
});
