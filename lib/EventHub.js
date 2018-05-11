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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Hub;
/**
 * Creates a simple pub sub object to which an application can subscribe, publish, and unsubscribe.
 * @param {Object} options hub options
 * @return {Object} the basic hub api
 */
function Hub() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var DEBUG = !!options.debugFn;
  var nextTickFn = void 0;
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
    DEBUG && console.log("Subscription to '" + event + "' added. Returning token: " + token + ".");
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
    for (var e in events) {
      if (events[e]) {
        for (var i = 0; i < events[e].length; i++) {
          if (events[e][i].token === token) {
            events[e].splice(i, 1);
            DEBUG && console.log("[EventHub] Unsubscribed token " + token + ".");
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

  return { subscribe: subscribe, publish: publish, unsubscribe: unsubscribe, nextTick: nextTick };
}
module.exports = exports["default"];

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = {
	"name": "evnt-hub",
	"version": "1.4.0",
	"description": "Event subscription library with window.postMessage support.",
	"main": "index.js",
	"scripts": {
		"build": "webpack --env build",
		"dev": "webpack --progress --colors --watch --env dev",
		"dev:demo": "concurrently \"npm run dev\" \"node server.js\"",
		"test": "jest",
		"test:watch": "jest --watch",
		"prepublish": "concurrently \"webpack --env build\" \"webpack --env dev\" \"npm run test\""
	},
	"repository": {
		"type": "git",
		"url": "git+https://github.com/auzmartist/event-hub.git"
	},
	"keywords": [
		"events",
		"pub",
		"sub",
		"postMessage"
	],
	"author": "Austin Martin",
	"license": "ISC",
	"bugs": {
		"url": "https://github.com/auzmartist/event-hub/issues"
	},
	"homepage": "https://github.com/auzmartist/event-hub#readme",
	"publishConfig": {
		"registry": "https://registry.npmjs.org/"
	},
	"devDependencies": {
		"babel": "^6.23.0",
		"babel-core": "^6.24.1",
		"babel-eslint": "^7.2.2",
		"babel-jest": "^22.4.3",
		"babel-loader": "^6.4.1",
		"babel-plugin-add-module-exports": "^0.2.1",
		"babel-preset-es2015": "^6.24.1",
		"chai": "^3.5.0",
		"concurrently": "^3.4.0",
		"cross-env": "^4.0.0",
		"eslint": "^3.19.0",
		"eslint-config-auz": "^1.0.0",
		"eslint-loader": "^1.7.1",
		"express": "^4.15.2",
		"jest": "^22.4.3",
		"jsdom": "^9.12.0",
		"jsdom-global": "^2.1.1",
		"mocha": "^3.2.0",
		"sinon": "^2.1.0",
		"webpack": "^2.4.1",
		"yargs": "^7.1.0"
	}
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _Hub = __webpack_require__(0);

var _Hub2 = _interopRequireDefault(_Hub);

var _package = __webpack_require__(1);

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isObj = function isObj(a) {
	return a === Object(a) && Object.prototype.toString.call(a) !== '[object Array]';
};

/**
 * Creates an event hub for pub/sub interactions and
 * window.postMessage communication for linking clients.
 * @param {Object} options configuration options for the hub
 * @return {Object} the public API of the EventHub library
 */

exports.default = function (options) {
	options = options || {};
	var debugFn = options.debugFn;
	var DEBUG = !!debugFn;

	var targetOrigin = options.targetOrigin || null;
	var targetWindow = options.targetWindow || null;
	var hubId = options.hubId || null;

	if (!targetOrigin && DEBUG) {
		console.warn('[EventHub] Cannot postMessage without a targetOrigin. Please add it to \'_init_\' event payload.');
	}
	if (!options.originRegex) console.warn('[EventHub] No originRegex provided. Incoming messages will not be checked.');

	var hub = new _Hub2.default({ debugFn: debugFn });

	hub.subscribe('_init_', function (type) {
		var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		if (!isObj(payload)) {
			// legacy behavior
			hubId = payload.toString();
		} else {
			hubId = payload.hubId.toString();
			targetOrigin = payload.targetOrigin ? payload.targetOrigin : targetOrigin;
			if (!targetOrigin) {
				console.error('[EventHub] No target origin supplied. Cannot postMessage.');
			}
		}
	});
	window.addEventListener('message', function (event) {
		var origin = event.origin || event.originalEvent.origin;
		var ok = isOriginValid(origin);
		if (!ok) {
			console.warn('[EventHub] message received from unknown origin. Ignoring.');
			return;
		}
		if (!event.data || !event.data._type || !event.data.payload) return;
		DEBUG && console.log('PostMessage event ' + event.data._type + ' received from ' + origin + '. Publishing.');
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
		var match = options.originRegex.exec(origin);
		return !!match;
	}

	/**
  * Publishes the event and sends a window.postMessage to the targetOrigin
  * @param {String} _type the event name and type of postMessage
  * @param {Object} payload the event and postMessage payload
  * @param {Object} window the window to postMessage to
  */
	function emit(_type) {
		var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var window = arguments[2];

		hub.publish(_type, payload);
		post(_type, payload, window);
	}

	/**
  * Sends a window.postMessage to the targetOrigin
  * @param {String} _type the type of postMessage
  * @param {Object} payload the postMessage payload
  * @param {Object} window the window to postMessage to (fallback: options.targetWindow)
  */
	function post(_type) {
		var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var window = arguments[2];

		// use the targetWindow as a fallback
		window = window || targetWindow;
		DEBUG && console.log('Attempting to postMessage ' + _type + ' to targetOrigin ' + targetOrigin + '. Payload: ', payload);
		if (window) {
			if (!hubId) console.warn('[EventHub] has no hubId.');
			if (isObj) payload._hubId = hubId;
			targetOrigin && window.postMessage({ _type: _type, payload: payload }, targetOrigin);
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
		about: function about() {
			return {
				hubId: hubId,
				originRegex: options.originRegex,
				targetOrigin: targetOrigin,
				targetWindow: targetWindow,
				debug: DEBUG,
				version: _package2.default.version
			};
		},
		emit: emit,
		isOriginValid: isOriginValid,
		nextTick: nextTick,
		post: post,
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