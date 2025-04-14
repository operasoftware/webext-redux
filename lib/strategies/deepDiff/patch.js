"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = patchObject;
var _constants = require("../constants");
var _arrayDiff = require("./arrayDiff");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Patches the given object according to the specified list of patches.
 * @param {Object} obj The object to patch
 * @param {Array} difference The array of differences generated from diffing
 */
function patchObject(obj, difference) {
  if (!difference.length) {
    return obj;
  }

  // Start with a shallow copy of the object.
  var newObject = _objectSpread({}, obj);

  // Iterate through the patches.
  difference.forEach(function (patch) {
    // If the value is an object whose keys are being updated,
    // then recursively patch the object.
    if (patch.change === _constants.DIFF_STATUS_KEYS_UPDATED) {
      newObject[patch.key] = patchObject(newObject[patch.key], patch.value);
    }
    // If the key has been deleted, delete it.
    else if (patch.change === _constants.DIFF_STATUS_REMOVED) {
      Reflect.deleteProperty(newObject, patch.key);
    }
    // If the key has been updated to a new value, update it.
    else if (patch.change === _constants.DIFF_STATUS_UPDATED) {
      newObject[patch.key] = patch.value;
    }
    // If the value is an array, update it
    else if (patch.change === _constants.DIFF_STATUS_ARRAY_UPDATED) {
      newObject[patch.key] = (0, _arrayDiff.applyPatch)(newObject[patch.key], patch.value);
    }
  });
  return newObject;
}