(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("EventHub", [], factory);
	else if(typeof exports === 'object')
		exports["EventHub"] = factory();
	else
		root["EventHub"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const isObj = (a) => (a === Object(a) && Object.prototype.toString.call(a) !== '[object Array]');
/**
 * Creates an event hub for pub/sub interactions and
 * window.postMessage communication for linking clients.
 * @param {Object} options configuration options for the hub
 * @return {Object} the public API of the EventHub library
 */
/* harmony default export */ __webpack_exports__["default"] = (function (options = { verbose: false }) {
    const targetWindow = options.targetWindow || null;
    const VERBOSE = options.verbose;
    let targetOrigin = options.targetOrigin || null;
    let hubId = options.hubId || null;
    if (!targetOrigin && VERBOSE) {
        console.warn('[EventHub] Cannot postMessage without a targetOrigin. Please add it to \'_init_\' event payload.');
    }
    if (!options.originRegex) {
        console.warn('[EventHub] No originRegex provided. Incoming messages will not be checked.');
    }
    let nextTickFn = function () { };
    const hub = (function () {
        let eventMap = {};
        let subUid = -1;
        /**
         * Subscribe to an event in the hub
         * @param {String} event the event being listened for
         * @param {Function} func the function to execute on publish
         * @return {String} a token identifying the subscription
         */
        function subscribe(event, func = function () { }) {
            if (!eventMap[event])
                eventMap[event] = [];
            let token = (++subUid).toString();
            eventMap[event].push({ token, func });
            VERBOSE && console.log(`Subscription to '${event}' added. Returning token: ${token}.`);
            return token;
        }
        /**
         * Publishes an event to the hub
         * @param {String} event the event being published
         * @param {String} payload any data associated with the event
         * @return {Boolean} if the publish was successfull
         */
        function publish(event, payload) {
            VERBOSE && console.log(`Event ${event} published. Payload: `, payload);
            if (!eventMap[event])
                return false;
            setTimeout(() => {
                const subscribers = eventMap[event];
                let idx = subscribers.length;
                while (idx--) {
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
        function unsubscribe(token) {
            let found = false;
            Object.values(eventMap).forEach((subscriptions) => {
                const idx = subscriptions.findIndex((s) => s.token === token);
                if (idx > -1) {
                    subscriptions.splice(idx, 1);
                    found = true;
                }
            });
            return found ? token : false;
        }
        return {
            subscribe,
            publish,
            unsubscribe
        };
    })();
    hub.subscribe('_init_', (type, payload = {}) => {
        hubId = payload.hubId.toString();
        targetOrigin = (payload.targetOrigin) ? payload.targetOrigin : targetOrigin;
        if (!targetOrigin) {
            console.error('[EventHub] No target origin supplied. Cannot postMessage.');
        }
    });
    window.addEventListener('message', (event) => {
        let origin = event.origin || event.originalEvent.origin;
        let ok = isOriginValid(origin);
        if (!ok) {
            console.warn('[EventHub] message received from unknown origin. Ignoring.');
            return;
        }
        if (!event.data || !event.data._type || !event.data.payload)
            return;
        VERBOSE && console.log(`PostMessage event ${event.data._type} received from ${origin}. Publishing.`);
        hub.publish(event.data._type, event.data.payload);
    });
    /**
     * Returns true if the origin matches the regex or if there is no originRegex configured.
     * @param {String} origin the origin of the event
     * @return {Boolean}
     */
    function isOriginValid(origin) {
        if (!options.originRegex) {
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
    function emit(type, payload = {}, window) {
        hub.publish(type, payload);
        post(type, payload, window);
    }
    /**
     * Sends a window.postMessage to the targetOrigin
     * @param {string} type the type of postMessage
     * @param {any} payload the postMessage payload
     * @param {Window} window the window to postMessage to (fallback: options.targetWindow)
     */
    function post(type, payload = {}, window) {
        // use the targetWindow as a fallback
        window = window || targetWindow;
        VERBOSE && console.log(`Attempting to postMessage ${type} to targetOrigin ${targetOrigin}. Payload: `, payload);
        if (window) {
            if (!hubId)
                console.warn('[EventHub] has no hubId.');
            if (isObj)
                payload._hubId = hubId;
            targetOrigin && window.postMessage({ type, payload }, targetOrigin);
        }
        else {
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


/***/ })
/******/ ])["default"];
});
//# sourceMappingURL=EventHub.js.map