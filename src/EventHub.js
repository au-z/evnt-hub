import Hub from './Hub.base';
import packageJson from '../package.json';

const isObj = (a) => (a === Object(a) && Object.prototype.toString.call(a) !== '[object Array]');

/**
 * Creates an event hub for pub/sub interactions and
 * window.postMessage communication for linking clients.
 * @param {Object} options configuration options for the hub
 * @return {Object} the public API of the EventHub library
 */
export default (function(options) {
	options = options || {};
	const debugFn = options.debugFn;
	const DEBUG = !!debugFn;

	let targetOrigin = options.targetOrigin || null;
	const targetWindow = options.targetWindow || null;
	let hubId = options.hubId || null;

	if(!targetOrigin && DEBUG) {
		console.warn('[EventHub] Cannot postMessage without a targetOrigin. Please add it to \'_init_\' event payload.');
	}
	if(!options.originRegex) console.warn('[EventHub] No originRegex provided. Incoming messages will not be checked.');

	const hub = new Hub({debugFn});

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
		DEBUG && console.log(`PostMessage event ${event.data._type} received from ${origin}. Publishing.`);
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
		DEBUG && console.log(`Attempting to postMessage ${_type} to targetOrigin ${targetOrigin}. Payload: `, payload);
		if(window) {
			if(!hubId) console.warn('[EventHub] has no hubId.');
			if(isObj(payload)) payload._hubId = hubId;
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
		hub.nextTick(cb);
	}

	return {
		about: () => ({
			hubId,
			originRegex: options.originRegex,
			targetOrigin,
			targetWindow,
			debug: DEBUG,
			version: packageJson.version,
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
