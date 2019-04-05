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
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var isObj = function isObj(a) {
  return a === Object(a) && Object.prototype.toString.call(a) !== '[object Array]';
};
/**
 * Creates an event hub for pub/sub interactions and
 * window.postMessage communication for linking clients.
 * @param {Object} options configuration options for the hub
 * @return {Object} the public API of the EventHub library
 */


/* harmony default export */ __webpack_exports__["default"] = (function (options) {
  var version = '1.3.1';
  options = options || {};
  var targetOrigin = options.targetOrigin || null;
  var targetWindow = options.targetWindow || null;
  var verbose = options.verbose || false;
  var hubId = options.hubId || null;

  if (!targetOrigin && verbose) {
    console.warn('[EventHub] Cannot postMessage without a targetOrigin. Please add it to \'_init_\' event payload.');
  }

  if (!options.originRegex) console.warn('[EventHub] No originRegex provided. Incoming messages will not be checked.');

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
      events[event].push({
        token: token,
        func: func
      });
      if (verbose) console.log("Subscription to '".concat(event, "' added. Returning token: ").concat(token, "."));
      return token;
    }
    /**
     * Publishes an event to the hub
     * @param {String} event the event being published
     * @param {String} payload any data associated with the event
     * @return {Boolean} if the publish was successfull
     */


    function publish(event, payload) {
      if (verbose) console.log("Event ".concat(event, " published. Payload: "), payload);
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

    return {
      subscribe: subscribe,
      publish: publish,
      unsubscribe: unsubscribe
    };
  }();

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
    if (verbose) console.log("PostMessage event ".concat(event.data._type, " received from ").concat(origin, ". Publishing."));
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
    var window = arguments.length > 2 ? arguments[2] : undefined;
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
    var window = arguments.length > 2 ? arguments[2] : undefined;
    // use the targetWindow as a fallback
    window = window || targetWindow;
    if (verbose) console.log("Attempting to postMessage ".concat(_type, " to targetOrigin ").concat(targetOrigin, ". Payload: "), payload);

    if (window) {
      if (!hubId) console.warn('[EventHub] has no hubId.');
      if (isObj) payload._hubId = hubId;
      targetOrigin && window.postMessage({
        _type: _type,
        payload: payload
      }, targetOrigin);
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
    about: function about() {
      return {
        hubId: hubId,
        originRegex: options.originRegex,
        targetOrigin: targetOrigin,
        targetWindow: targetWindow,
        verbose: verbose,
        version: version
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
});

/***/ })
/******/ ]);
});
//# sourceMappingURL=EventHub.js.map