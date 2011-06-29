requireCss("./dataGrid/dataGrid.css");

var fun   = require("../../uki-core/function");
var dom   = require("../../uki-core/dom");
var utils = require("../../uki-core/utils");
var view  = require("../../uki-core/view");

var DataList = require("./dataList").DataList;
var Pack = require("./dataGrid/pack").Pack;
var Metrics = require("./dataGrid/metrics").Metrics;
var SelectionController =
  require("./dataGrid/selectionController").SelectionController;


var DataGrid = view.newClass('DataGrid', DataList, {

  _template: requireText('dataGrid/pack.html'),

  _setup: function(initArgs) {
    'metrics' in initArgs || (initArgs.metrics = new Metrics());
    'editorController' in initArgs || (initArgs.editorController = null);
    'packView' in initArgs || (initArgs.packView = Pack);
    'selectionController' in initArgs ||
      (initArgs.selectionController = new SelectionController());
    return DataList.prototype._setup.call(this, initArgs);
  },

  cellsPerRow: fun.newDelegateProp('metrics', 'cellsPerRow'),

  deduceCellDimensions: function() {
    if (!this.data().length) {
      return [0, 0];
    }

    var sample = this.data().slice(0, 1)[0];
    var pack = this._createPack();
    this.appendChild(pack);
    pack.render([sample], [], 0);
    var height = pack.dom().offsetHeight;
    var width = pack.dom().offsetWidth;
    this.removeChild(pack);
    return [width, height];
  },

  clientWidth: function() {
    return this.dom().clientWidth;
  },

  _positionPack: function(pack) {
    var firstRowD = this.metrics().cellDimensions(pack.from);
    var lastRowD = this.metrics().cellDimensions(pack.to - 1);
    pack.top(firstRowD.top);
    pack.fromPX = firstRowD.top;
    pack.offsetPX = firstRowD.offset;
    pack.toPX = lastRowD.top + lastRowD.height;

    pack.top(firstRowD.top);
    pack.fillerWidth(firstRowD.offset);
  },

  _repositionPacks: function() {
    this.childViews().forEach(this._positionPack, this);
  },

  _rowsToRender: function() {
    var rangeInPX = this._rangeWithPrerender();
    return this.metrics().cellsForRange(rangeInPX);
  },

  _update: function() {
    if (this.metrics().updateCellsPerRow()) {
      this._updateHeight();
      this._repositionPacks();
    }
    return DataList.prototype._update.call(this);
  }

});

exports.DataGrid = DataGrid;
