import packageJson from '../package.json';
import Hub from './Hub';

interface HubOptions {
	targetWindow?: Window
	targetOrigin?: string
	originRegex?: RegExp
	hubId?: string
	verbose: boolean
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

	const hub = Hub(VERBOSE);
	hub.subscribe('_init_', (type: string, payload: any = {}, meta: object) => {
		hubId = payload.hubId.toString();
		targetOrigin = (payload.targetOrigin) ? payload.targetOrigin : targetOrigin;
		if(!targetOrigin) {
			console.error('[EventHub] No target origin supplied. Cannot postMessage.');
		}
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
	 * A regular subscription that only resolves if a matching correlationId is published.
	 * The subscription is then cancelled.
	 * @param type the subscription name
	 * @param func the function to invoke
	 * @param correlationId a unique token to correlate sent and received events
	 */
	function subscribeOnce(type: string, func: Function, correlationId: string) {
		if(correlationId == null || correlationId === '') {
			throw new Error('[EventHub] cannot subscribeOnce if no correlationId is provided')
		}
		let sub = hub.subscribe(type, (type: string, payload: any, meta: any) => {
			if(meta.correlates) {
				hub.unsubscribe(sub);
				func(type, payload, meta);
			}
		}, correlationId);
		return sub;
	}

	/**
	 * Sends a window.postMessage to the targetOrigin
	 * @param {string} type the type of postMessage
	 * @param {any} payload the postMessage payload
	 * @param {Window} window the window to postMessage to (fallback: options.targetWindow)
	 * @param {String} correlationId a unique token to correlate sent and received events
	 */
	function post(type: string, payload: any = {}, window: Window | null, correlationId: string) {
		// use the targetWindow as a fallback
		window = window || targetWindow;
		VERBOSE && console.log(`Attempting to postMessage '${type}' to targetOrigin ${targetOrigin}. Payload: `, payload);
		if(window) {
			if(!hubId) console.warn('[EventHub] has no hubId.');
			targetOrigin && window.postMessage({type, payload, _meta: {
				hubId,
				correlationId,
				version: packageJson.version,
			}}, targetOrigin);
		} else {
			console.error('[EventHub] cannot postMessage to falsy window.');
		}
	}

	/**
	 * Publishes the event to the local hub AND sends a window.postMessage to the targetOrigin
	 * @param {string} type the event name and type of postMessage
	 * @param {any} payload the event and postMessage payload
	 * @param {Window} window the window to postMessage to
	 * @param {String} correlationId a unique token to correlate sent and received events
	 */
	function emit(type: string, payload: any = {}, window: Window | null, correlationId: string) {
		hub.publish(type, payload, correlationId);
		post(type, payload, window, correlationId);
	}

	/**
	 * Returns a promise that resolves whenever the supplied event is received in response.
	 * @param reqEvent the event to request
	 * @param resEvent the event to resolve from
	 * @param reqBody the request event payload
	 * @param correlationId a unique token to correlate sent and received events
	 */
	function request(reqEvent: string, resEvent: string, reqBody: any = {}, window: Window | null, correlationId: string) : Promise<any> {
		var requesting = new Promise((res, rej) => hub.subscribe(resEvent, (e: any, payload: any, _meta: any) => {
			res({value: payload, _meta});
		}, correlationId));
		emit(reqEvent, reqBody, window, correlationId);
		return requesting;
	}

	/**
	 * Returns a promise that resolves once if and only if a response event with matching correlationId is received.
	 * @param reqEvent the event to request
	 * @param resEvent the event to resolve from
	 * @param reqBody the request event payload
	 * @param correlationId a unique token to correlate sent and received events
	 */
	function requestOnce(reqEvent: string, resEvent: string, reqBody: any = {}, window: Window | null, correlationId: string) : Promise<any> {
		var requesting = new Promise((res, rej) => subscribeOnce(resEvent, (e: any, payload: any, _meta: any) => {
			res({value: payload, _meta});
		}, correlationId));
		// postMessage AND publish to stay handler origin agnostic
		emit(reqEvent, reqBody, window, correlationId);
		return requesting;
	}

	window.addEventListener('message', (event) => {
		let origin = event.origin || ((event as any).originalEvent && (event as any).originalEvent.origin);
		let ok = isOriginValid(origin);
		if(!ok) {
			console.warn('[EventHub] message received from unknown origin. Ignoring.');
			return;
		}
		if(!event.data || !event.data.type || !event.data.payload) return;
		VERBOSE && console.log(`PostMessage event '${event.data._type}' received from ${origin}. Publishing.`);
		hub.publish(event.data.type, event.data.payload, (event.data._meta) ? event.data._meta.correlationId : null);
	});

	return {
		about: () => ({
			hubId,
			originRegex: options.originRegex,
			targetOrigin,
			targetWindow,
			verbose: VERBOSE,
			version: packageJson.version,
		}),
		nextTick: hub.nextTick,
		publish: hub.publish,
		subscribe: hub.subscribe,
		subscribeOnce,
		unsubscribe: hub.unsubscribe,
		isOriginValid,
		post,
		emit,
		request,
		requestOnce,
	};
});
