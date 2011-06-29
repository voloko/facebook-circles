var fun = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var Observable = require("../../../uki-core/observable").Observable;


var Metrics = fun.newClass(Observable, {

  initWithView: function(view) {
    this._view = view;
  },

  _rowHeight: 0,

  initLayout: function() {
    this._rowHeight = this._view.deduceRowHeight();
  },

  rowsForRange: function(range) {
    return {
      from: range.from / this._rowHeight << 0,
      to:   Math.ceil(range.to / this._rowHeight)
    };
  },

  rowForPosition: function(px) {
    return px / this._rowHeight << 0;
  },

  rowDimensions: function(index) {
    return {
      top: this._rowHeight * index,
      height: this._rowHeight
    };
  },

  totalHeight: function() {
    return this._rowHeight * this._view.data().length;
  }

});


exports.Metrics = Metrics;
