"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DIFF_STATUS_UPDATED = exports.DIFF_STATUS_REMOVED = exports.DIFF_STATUS_KEYS_UPDATED = exports.DIFF_STATUS_ARRAY_UPDATED = void 0;
// The `change` value for updated or inserted fields resulting from shallow diff
var DIFF_STATUS_UPDATED = exports.DIFF_STATUS_UPDATED = 'updated';

// The `change` value for removed fields resulting from shallow diff
var DIFF_STATUS_REMOVED = exports.DIFF_STATUS_REMOVED = 'removed';
var DIFF_STATUS_KEYS_UPDATED = exports.DIFF_STATUS_KEYS_UPDATED = 'updated_keys';
var DIFF_STATUS_ARRAY_UPDATED = exports.DIFF_STATUS_ARRAY_UPDATED = 'updated_array';