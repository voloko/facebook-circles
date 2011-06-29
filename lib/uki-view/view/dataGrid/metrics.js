var fun = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");

var Observable = require("../../../uki-core/observable").Observable;

var Metrics = fun.newClass(Observable, {

  initWithView: function(view) {
    this._view = view;
  },

  _cellHeight: 0,

  _cellWidth: 0,

  _cellsPerRow: 0,

  initLayout: function() {
    var d = this._view.deduceCellDimensions();
    this._cellWidth = d[0];
    this._cellHeight = d[1];
    this._cellsPerRow = 0;
  },

  cellsPerRow: function(force) {
    if (!this._cellsPerRow || force) {
      this._cellsPerRow = Math.max(
        this._view.clientWidth() / this._cellWidth << 0, 1);
    }
    return this._cellsPerRow;
  },

  updateCellsPerRow: function() {
    var old = this._cellsPerRow;
    this._cellsPerRow = this.cellsPerRow(true);
    return old != this._cellsPerRow;
  },

  cellsForRange: function(range) {
    return {
      from: (range.from / this._cellHeight << 0) * this.cellsPerRow(),
      to:   Math.ceil(range.to / this._cellHeight) * this.cellsPerRow()
    };
  },

  // dataList-pack API
  rowsForRange: function(range) {
    return this.cellsForRange(range);
  },

  cellForPosition: function(x, y) {
    return (y / this._cellHeight << 0) * this.cellsPerRow() +
      Math.ceil(x / this._cellWidth << 0);
  },

  rowForPosition: function(px) {
    return this.cellForPosition(0, px);
  },

  cellDimensions: function(index) {
    return {
      top: this._cellHeight * (index / this.cellsPerRow() << 0),
      height: this._cellHeight,
      width: this._cellWidth,
      offset: (index % this.cellsPerRow()) * this._cellWidth
    };
  },

  // dataList-pack API
  rowDimensions: function(index) {
    return this.cellDimensions(index);
  },

  totalHeight: function() {
    return this._cellHeight * Math.ceil(
      this._view.data().length / this.cellsPerRow());
  }

});


exports.Metrics = Metrics;
