"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _lodash = _interopRequireDefault(require("lodash.assignin"));
var _constants = require("../constants");
var _serialization = require("../serialization");
var _patch = _interopRequireDefault(require("../strategies/shallowDiff/patch"));
var _util = require("../util");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var backgroundErrPrefix = '\nLooks like there is an error in the background page. ' + 'You might want to inspect your background page for more details.\n';
var defaultOpts = {
  channelName: _constants.DEFAULT_CHANNEL_NAME,
  state: {},
  serializer: _serialization.noop,
  deserializer: _serialization.noop,
  patchStrategy: _patch["default"]
};
var Store = /*#__PURE__*/function () {
  /**
   * Creates a new Proxy store
   * @param  {object} options
   * @param {string} options.channelName The name of the channel for this store.
   * @param {object} options.state The initial state of the store (default
   * `{}`).
   * @param {function} options.serializer A function to serialize outgoing
   * messages (default is passthrough).
   * @param {function} options.deserializer A function to deserialize incoming
   * messages (default is passthrough).
   * @param {function} options.patchStrategy A function to patch the state with
   * incoming messages. Use one of the included patching strategies or a custom
   * patching function. (default is shallow diff).
   */
  function Store() {
    var _this = this;
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultOpts,
      _ref$channelName = _ref.channelName,
      channelName = _ref$channelName === void 0 ? defaultOpts.channelName : _ref$channelName,
      _ref$state = _ref.state,
      state = _ref$state === void 0 ? defaultOpts.state : _ref$state,
      _ref$serializer = _ref.serializer,
      serializer = _ref$serializer === void 0 ? defaultOpts.serializer : _ref$serializer,
      _ref$deserializer = _ref.deserializer,
      deserializer = _ref$deserializer === void 0 ? defaultOpts.deserializer : _ref$deserializer,
      _ref$patchStrategy = _ref.patchStrategy,
      patchStrategy = _ref$patchStrategy === void 0 ? defaultOpts.patchStrategy : _ref$patchStrategy;
    _classCallCheck(this, Store);
    if (!channelName) {
      throw new Error('channelName is required in options');
    }
    if (typeof serializer !== 'function') {
      throw new Error('serializer must be a function');
    }
    if (typeof deserializer !== 'function') {
      throw new Error('deserializer must be a function');
    }
    if (typeof patchStrategy !== 'function') {
      throw new Error('patchStrategy must be one of the included patching strategies or a custom patching function');
    }
    this.channelName = channelName;
    this.readyResolved = false;
    this.readyPromise = new Promise(function (resolve) {
      return _this.readyResolve = resolve;
    });
    this.browserAPI = (0, _util.getBrowserAPI)();
    this.initializeStore = this.initializeStore.bind(this);

    // We request the latest available state data to initialise our store
    this.browserAPI.runtime.sendMessage({
      type: _constants.FETCH_STATE_TYPE,
      channelName: channelName
    }, undefined, this.initializeStore);
    this.deserializer = deserializer;
    this.serializedPortListener = (0, _serialization.withDeserializer)(deserializer)(function () {
      var _this$browserAPI$runt;
      return (_this$browserAPI$runt = _this.browserAPI.runtime.onMessage).addListener.apply(_this$browserAPI$runt, arguments);
    });
    this.serializedMessageSender = (0, _serialization.withSerializer)(serializer)(function () {
      var _this$browserAPI$runt2;
      return (_this$browserAPI$runt2 = _this.browserAPI.runtime).sendMessage.apply(_this$browserAPI$runt2, arguments);
    });
    this.listeners = [];
    this.state = state;
    this.patchStrategy = patchStrategy;

    /**
     * Determine if the message should be run through the deserializer. We want
     * to skip processing messages that probably didn't come from this library.
     * Note that the listener below is still called for each message so it needs
     * its own guard, the shouldDeserialize predicate only skips _deserializing_
     * the message.
     */
    var shouldDeserialize = function shouldDeserialize(message) {
      return Boolean(message) && typeof message.type === "string" && message.channelName === _this.channelName;
    };
    this.serializedPortListener(function (message) {
      if (!message || message.channelName !== _this.channelName) {
        return;
      }
      switch (message.type) {
        case _constants.STATE_TYPE:
          _this.replaceState(message.payload);
          if (!_this.readyResolved) {
            _this.readyResolved = true;
            _this.readyResolve();
          }
          break;
        case _constants.PATCH_STATE_TYPE:
          _this.patchState(message.payload);
          break;
        default:
        // do nothing
      }
    }, shouldDeserialize);
    this.dispatch = this.dispatch.bind(this); // add this context to dispatch
    this.getState = this.getState.bind(this); // add this context to getState
    this.subscribe = this.subscribe.bind(this); // add this context to subscribe
  }

  /**
  * Returns a promise that resolves when the store is ready. Optionally a callback may be passed in instead.
  * @param [function] callback An optional callback that may be passed in and will fire when the store is ready.
  * @return {object} promise A promise that resolves when the store has established a connection with the background page.
  */
  return _createClass(Store, [{
    key: "ready",
    value: function ready() {
      var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      if (cb !== null) {
        return this.readyPromise.then(cb);
      }
      return this.readyPromise;
    }

    /**
     * Subscribes a listener function for all state changes
     * @param  {function} listener A listener function to be called when store state changes
     * @return {function}          An unsubscribe function which can be called to remove the listener from state updates
     */
  }, {
    key: "subscribe",
    value: function subscribe(listener) {
      var _this2 = this;
      this.listeners.push(listener);
      return function () {
        _this2.listeners = _this2.listeners.filter(function (l) {
          return l !== listener;
        });
      };
    }

    /**
     * Replaces the state for only the keys in the updated state. Notifies all listeners of state change.
     * @param {object} state the new (partial) redux state
     */
  }, {
    key: "patchState",
    value: function patchState(difference) {
      this.state = this.patchStrategy(this.state, difference);
      this.listeners.forEach(function (l) {
        return l();
      });
    }

    /**
     * Replace the current state with a new state. Notifies all listeners of state change.
     * @param  {object} state The new state for the store
     */
  }, {
    key: "replaceState",
    value: function replaceState(state) {
      this.state = state;
      this.listeners.forEach(function (l) {
        return l();
      });
    }

    /**
     * Get the current state of the store
     * @return {object} the current store state
     */
  }, {
    key: "getState",
    value: function getState() {
      return this.state;
    }

    /**
     * Stub function to stay consistent with Redux Store API. No-op.
     */
  }, {
    key: "replaceReducer",
    value: function replaceReducer() {
      return;
    }

    /**
     * Dispatch an action to the background using messaging passing
     * @param  {object} data The action data to dispatch
     * @return {Promise}     Promise that will resolve/reject based on the action response from the background
     */
  }, {
    key: "dispatch",
    value: function dispatch(data) {
      var _this3 = this;
      return new Promise(function (resolve, reject) {
        _this3.serializedMessageSender({
          type: _constants.DISPATCH_TYPE,
          channelName: _this3.channelName,
          payload: data
        }, null, function (resp) {
          if (!resp) {
            var _error = _this3.browserAPI.runtime.lastError;
            var bgErr = new Error("".concat(backgroundErrPrefix).concat(_error));
            reject((0, _lodash["default"])(bgErr, _error));
            return;
          }
          var error = resp.error,
            value = resp.value;
          if (error) {
            var _bgErr = new Error("".concat(backgroundErrPrefix).concat(error));
            reject((0, _lodash["default"])(_bgErr, error));
          } else {
            resolve(value && value.payload);
          }
        });
      });
    }
  }, {
    key: "initializeStore",
    value: function initializeStore(message) {
      if (message && message.type === _constants.FETCH_STATE_TYPE) {
        this.replaceState(message.payload);

        // Resolve if readyPromise has not been resolved.
        if (!this.readyResolved) {
          this.readyResolved = true;
          this.readyResolve();
        }
      }
    }
  }]);
}();
var _default = exports["default"] = Store;