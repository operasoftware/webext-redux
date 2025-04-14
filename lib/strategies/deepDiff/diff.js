"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = diffObjects;
var _constants = require("../constants");
var _arrayDiff = require("./arrayDiff");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var objectConstructor = {}.constructor;
function isObject(o) {
  return _typeof(o) === "object" && o !== null && o.constructor === objectConstructor;
}
function shouldTreatAsValue(oldObj, newObj) {
  var bothAreArrays = Array.isArray(oldObj) && Array.isArray(newObj);
  return !isObject(newObj) && !bothAreArrays || _typeof(newObj) !== _typeof(oldObj);
}
function diffValues(oldObj, newObj, shouldContinue, context) {
  // If it's null, use the current value
  if (oldObj === null) {
    return {
      change: _constants.DIFF_STATUS_UPDATED,
      value: newObj
    };
  }

  // If it's a non-object, or if the type is changing, or if it's an array,
  // just go with the current value.
  if (shouldTreatAsValue(oldObj, newObj) || !shouldContinue(oldObj, newObj, context)) {
    return {
      change: _constants.DIFF_STATUS_UPDATED,
      value: newObj
    };
  }
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    return {
      change: _constants.DIFF_STATUS_ARRAY_UPDATED,
      value: (0, _arrayDiff.getPatch)(oldObj, newObj)
    };
  }

  // If it's an object, compute the differences for each key.
  return {
    change: _constants.DIFF_STATUS_KEYS_UPDATED,
    value: diffObjects(oldObj, newObj, shouldContinue, context)
  };
}

/**
 * Performs a deep diff on two objects, created a nested list of patches. For objects, each key is compared.
 * If keys are not equal by reference, diffing continues on the key's corresponding values in the old and new
 * objects. If keys have been removed, they are recorded as such.
 * Non-object, non-array values that are not equal are recorded as updated values. Arrays are diffed shallowly.
 * The shouldContinue function is called on every potential value comparison with the current and previous objects
 * (at the present state in the tree) and the current path through the tree as an additional `context` parameter.
 * Returning false from this function will treat the current value as an updated value, regardless of whether or
 * not it is actually an object.
 * @param {Object} oldObj The old object
 * @param {Object} newObj The new object
 * @param {Function} shouldContinue Called with oldObj, newObj, and context, which is the current object path
 * Return false to stop diffing and treat everything under the current key as an updated value
 * @param {*} context
 */
function diffObjects(oldObj, newObj) {
  var shouldContinue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {
    return true;
  };
  var context = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
  var difference = [];

  // For each key in the current state,
  // get the differences in values.
  Object.keys(newObj).forEach(function (key) {
    if (oldObj[key] !== newObj[key]) {
      difference.push(_objectSpread({
        key: key
      }, diffValues(oldObj[key], newObj[key], shouldContinue, context.concat(key))));
    }
  });

  // For each key previously present,
  // record its deletion.
  Object.keys(oldObj).forEach(function (key) {
    if (!newObj.hasOwnProperty(key)) {
      difference.push({
        key: key,
        change: _constants.DIFF_STATUS_REMOVED
      });
    }
  });
  return difference;
}