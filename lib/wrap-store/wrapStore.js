"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _constants = require("../constants");
var _serialization = require("../serialization");
var _util = require("../util");
var _diff = _interopRequireDefault(require("../strategies/shallowDiff/diff"));
var _listener = require("../listener");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
/**
 * Responder for promisified results
 * @param  {object} dispatchResult The result from `store.dispatch()`
 * @param  {function} send         The function used to respond to original message
 * @return {undefined}
 */
var promiseResponder = function promiseResponder(dispatchResult, send) {
  Promise.resolve(dispatchResult).then(function (res) {
    send({
      error: null,
      value: res
    });
  })["catch"](function (err) {
    console.error("error dispatching result:", err);
    send({
      error: err.message,
      value: null
    });
  });
};
var defaultOpts = {
  channelName: _constants.DEFAULT_CHANNEL_NAME,
  dispatchResponder: promiseResponder,
  serializer: _serialization.noop,
  deserializer: _serialization.noop,
  diffStrategy: _diff["default"]
};

/**
 * @typedef {function} WrapStore
 * @param {Object} store A Redux store
 * @param {Object} options
 * @param {function} options.dispatchResponder A function that takes the result
 * of a store dispatch and optionally implements custom logic for responding to
 * the original dispatch message.
 * @param {function} options.serializer A function to serialize outgoing message
 * payloads (default is passthrough).
 * @param {function} options.deserializer A function to deserialize incoming
 * message payloads (default is passthrough).
 * @param {function} options.diffStrategy A function to diff the previous state
 * and the new state (default is shallow diff).
 */

/**
 * Wraps a Redux store so that proxy stores can connect to it. This function
 * must be called synchronously when the extension loads to avoid dropping
 * messages that woke the service worker.
 * @param {Object} options
 * @param {string} options.channelName The name of the channel for this store.
 * @return {WrapStore} The wrapStore function that accepts a Redux store and
 * options. See {@link WrapStore}.
 */
var _default = exports["default"] = function _default() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultOpts,
    _ref$channelName = _ref.channelName,
    channelName = _ref$channelName === void 0 ? defaultOpts.channelName : _ref$channelName;
  var browserAPI = (0, _util.getBrowserAPI)();
  var filterStateMessages = function filterStateMessages(message) {
    return message.type === _constants.FETCH_STATE_TYPE && message.channelName === channelName;
  };
  var filterActionMessages = function filterActionMessages(message) {
    return message.type === _constants.DISPATCH_TYPE && message.channelName === channelName;
  };

  // Setup message listeners synchronously to avoid dropping messages if the
  // extension is woken by a message.
  var stateProviderListener = (0, _listener.createDeferredListener)(filterStateMessages);
  var actionListener = (0, _listener.createDeferredListener)(filterActionMessages);
  browserAPI.runtime.onMessage.addListener(stateProviderListener.listener);
  browserAPI.runtime.onMessage.addListener(actionListener.listener);
  return function (store) {
    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultOpts,
      _ref2$dispatchRespond = _ref2.dispatchResponder,
      dispatchResponder = _ref2$dispatchRespond === void 0 ? defaultOpts.dispatchResponder : _ref2$dispatchRespond,
      _ref2$serializer = _ref2.serializer,
      serializer = _ref2$serializer === void 0 ? defaultOpts.serializer : _ref2$serializer,
      _ref2$deserializer = _ref2.deserializer,
      deserializer = _ref2$deserializer === void 0 ? defaultOpts.deserializer : _ref2$deserializer,
      _ref2$diffStrategy = _ref2.diffStrategy,
      diffStrategy = _ref2$diffStrategy === void 0 ? defaultOpts.diffStrategy : _ref2$diffStrategy;
    if (typeof serializer !== "function") {
      throw new Error("serializer must be a function");
    }
    if (typeof deserializer !== "function") {
      throw new Error("deserializer must be a function");
    }
    if (typeof diffStrategy !== "function") {
      throw new Error("diffStrategy must be one of the included diffing strategies or a custom diff function");
    }

    /**
     * Respond to dispatches from UI components
     */
    var dispatchResponse = function dispatchResponse(request, sender, sendResponse) {
      //  Only called with messages that pass the filterActionMessages filter.
      var action = Object.assign({}, request.payload, {
        _sender: sender
      });
      var dispatchResult = null;
      try {
        dispatchResult = store.dispatch(action);
      } catch (e) {
        dispatchResult = Promise.reject(e.message);
        console.error(e);
      }
      dispatchResponder(dispatchResult, sendResponse);
    };

    /**
     * Setup for state updates
     */
    var serializedMessagePoster = (0, _serialization.withSerializer)(serializer)(function () {
      var _browserAPI$runtime;
      var onErrorCallback = function onErrorCallback() {
        if (browserAPI.runtime.lastError) {
          // do nothing - errors can be present
          // if no content script exists on receiver
        }
      };
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      (_browserAPI$runtime = browserAPI.runtime).sendMessage.apply(_browserAPI$runtime, args.concat([onErrorCallback]));

      /*
        * With this approach, if you open the extension in a new tab, we will patch the state twice.
        * We still do not use redux for content scripts, so we can rework this code only if necessary.
        */
      // We will broadcast state changes to all tabs to sync state across content scripts
      // return browserAPI.tabs.query({}, (tabs) => {
      //   for (const tab of tabs) {
      //     browserAPI.tabs.sendMessage(tab.id, ...args, onErrorCallback);
      //   }
      // });
    });
    var currentState = store.getState();
    var patchState = function patchState() {
      var newState = store.getState();
      var diff = diffStrategy(currentState, newState);
      if (diff.length) {
        currentState = newState;
        serializedMessagePoster({
          type: _constants.PATCH_STATE_TYPE,
          payload: diff,
          channelName: channelName // Notifying what store is broadcasting the state changes
        });
      }
    };

    // Send patched state to listeners on every redux store state change
    store.subscribe(patchState);

    // Send store's initial state
    serializedMessagePoster({
      type: _constants.STATE_TYPE,
      payload: currentState,
      channelName: channelName // Notifying what store is broadcasting the state changes
    });

    /**
     * State provider for content-script initialization
     */
    stateProviderListener.setListener(function (request, sender, sendResponse) {
      // This listener is only called with messages that pass filterStateMessages
      var state = store.getState();
      sendResponse({
        type: _constants.FETCH_STATE_TYPE,
        payload: state
      });
    });

    /**
     * Setup action handler
     */
    var withPayloadDeserializer = (0, _serialization.withDeserializer)(deserializer);
    withPayloadDeserializer(actionListener.setListener)(dispatchResponse, filterActionMessages);
  };
};