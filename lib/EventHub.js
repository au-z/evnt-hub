(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("EventHub", [], factory);
	else if(typeof exports === 'object')
		exports["EventHub"] = factory();
	else
		root["EventHub"] = factory();
})(this, function() {
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
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
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
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

/* eslint-disable no-console */
/**
 * Creates an event hub for pub/sub interactions and
 * window.postMessage communication for linking clients.
 * @param {Object} options configuration options for the hub
 * @return {Object} the public API of the EventHub library
 */
exports.default = function (options) {
	var version = '1.0.0';
	options = options || {};
	if (!options.targetOrigin) console.error('[EventHub] targetOrigin not provided.');
	var hubId = null;
	var nextTickFn = function nextTickFn() {};

	var hub = function (q) {
		var events = {};
		var subUid = -1;

		/**
   * Subscribe to an event in the hub
   * @param {String} event the event being listened for
   * @param {Function} func the function to execute on publish
   * @return {String} a token identifying the subscription
   */
		function subscribe(event) {
			var func = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

			if (!events[event]) events[event] = [];
			var token = (++subUid).toString();
			events[event].push({ token: token, func: func });
			return token;
		}

		/**
   * Publishes an event to the hub
   * @param {String} event the event being published
   * @param {String} payload any data associated with the event
   * @return {Boolean} if the publish was successfull
   */
		function publish(event, payload) {
			if (!events[event]) return false;
			setTimeout(function () {
				var subscribers = events[event];
				var len = subscribers ? subscribers.length : 0;
				while (len--) {
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
			for (var e in events) {
				if (events[e]) {
					for (var i = 0; i < events[e].length; i++) {
						if (events[e][i].token === token) {
							events[e].splice(i, 1);
							return token;
						}
					}
				}
			}
			return false;
		}

		return { subscribe: subscribe, publish: publish, unsubscribe: unsubscribe };
	}();

	hub.subscribe('_init_', function (type, payload) {
		hubId = payload.toString();
	});
	window.addEventListener('message', function (event) {
		var origin = event.origin || event.originalEvent.origin;
		if (origin !== options.targetOrigin) {
			console.warn('[EventHub] message received from unknown origin. Ignoring.');
			return;
		}
		if (!event.data || !event.data._type || !event.data.payload) {
			console.error('[EventHub] No type or payload sent with message data');
		}
		hub.publish(event.data._type, event.data.payload);
	});

	/**
  * Publishes the event and sends a window.postMessage to the targetOrigin
  * @param {String} _type the event name and type of postMessage
  * @param {Object} payload the event and postMessage payload
  */
	function emit(_type) {
		var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		hub.publish(_type, payload);
		post(_type, payload);
	}

	/**
  * Sends a window.postMessage to the targetOrigin
  * @param {String} _type the type of postMessage
  * @param {Object} payload the postMessage payload
  */
	function post(_type) {
		var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		if (window.parent) {
			if (!hubId) console.warn('[EventHub] no hubId provided.');
			payload._hubId = hubId;
			window.parent.postMessage({ _type: _type, payload: payload }, options.targetOrigin);
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
		version: version,
		emit: emit,
		nextTick: nextTick,
		publish: hub.publish,
		subscribe: hub.subscribe,
		unsubscribe: hub.unsubscribe
	};
};

module.exports = exports['default'];

/***/ })
/******/ ]);
});
//# sourceMappingURL=EventHub.js.map