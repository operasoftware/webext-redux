"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STATE_TYPE = exports.PATCH_STATE_TYPE = exports.FETCH_STATE_TYPE = exports.DISPATCH_TYPE = exports.DEFAULT_CHANNEL_NAME = void 0;
// Message type used for dispatch events
// from the Proxy Stores to background
var DISPATCH_TYPE = exports.DISPATCH_TYPE = "webext.dispatch";

// Message type for fetching current state from
// background to Proxy Stores
var FETCH_STATE_TYPE = exports.FETCH_STATE_TYPE = "webext.fetch_state";

// Message type for state update events from
// background to Proxy Stores
var STATE_TYPE = exports.STATE_TYPE = "webext.state";

// Message type for state patch events from
// background to Proxy Stores
var PATCH_STATE_TYPE = exports.PATCH_STATE_TYPE = "webext.patch_state";

// The default name for the store channel
var DEFAULT_CHANNEL_NAME = exports.DEFAULT_CHANNEL_NAME = "webext.channel";