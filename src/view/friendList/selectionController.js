var Base = require('../lib/uki-view/view/dataGrid/selectionController').SelectionController;

var dom = require('../../../lib/uki-core/dom');
var fun = require("../../../lib/uki-core/function");
var evt = require("../../../lib/uki-core/event");
var env = require("../../../lib/uki-core/env");

var SelectionController = fun.newClass(Base, {
  initWithView: function(view) {
    this._view = view;
    this._view.on('selectiondragstart', 
     fun.bind(this._onSelectionDragStart, this));
    this._view.on('selectiondrag', 
     fun.bind(this._onSelectionDrag, this));
    this._view.on('selectiondragend', 
     fun.bind(this._onSelectionDragEnd, this));
    Base.prototype.initWithView.call(this, view);
  },

  _onSelectionDragStart: function(e) {
    this._selectorDiv = dom.createElement('div', {
      style: 'position:absolute; opacity: 0.3; -ms-filter:"progid:DXImageTransform.Microsoft.Alpha(opacity=30)" ;filter:alpha(opacity=30);'
      });
    this._selectorDiv.style.backgroundColor = '#4ea7df';
    this._selectorDiv.style.border = '2px solid black';
    this._selectorDiv.style.top = e.offsetY + 'px';
    this._selectorDiv.style.left = e.offsetX + 'px';
    this._selectorDiv.style.width = '1px';
    this._selectorDiv.style.height = '1px';
    this._selectorDivStart = {
      x: e.offsetX, y: e.offsetY};
    this._view._dom.appendChild(this._selectorDiv);
    this._currentlySelected = {};
  },

  _getRectForSelectionDrag: function(e) {
    // get the client rectangle... find all indexes underneath it.
    if (e.dragOffset.x >= 0) {
      var width = e.dragOffset.x;
      var left = this._selectorDivStart.x;
    } else {
      var width = -1.0 * e.dragOffset.x;
      var left = this._selectorDivStart.x - width;
    }

    if (e.dragOffset.y >= 0) {
      var height = e.dragOffset.y;
      var top = this._selectorDivStart.y;
    } else {
      var height = -1.0 * e.dragOffset.y;
      var top = this._selectorDivStart.y - height;
    }
    return {top:top, left:left, width:width, height:height};
  },

  _selectIndexesUnderRect: function(rect) {
    var start_index = this._view.metrics().cellForPosition(rect.left, rect.top);

    var end_index = this._view.metrics().cellForPosition(
      rect.left + rect.width, rect.top + rect.height)

    var cells_per_row = this._view.metrics().cellsPerRow();
    var start_index_row = parseInt(start_index / cells_per_row);
    var start_index_col = start_index - cells_per_row * start_index_row;
    var end_index_row = parseInt(end_index / cells_per_row);
    var end_index_col = end_index - cells_per_row * end_index_row;
    var start_pos = {row:start_index_row, col:start_index_col};
    var end_pos = {row:end_index_row, col:end_index_col};
    var selected_indexes = {};
    var index;
    for (var col = start_pos.col; col <= end_pos.col; col++) {
      for (var row = start_pos.row; row <= end_pos.row; row++) {
        index = row * cells_per_row + col;
        selected_indexes[index] = 1;
      }
    }
    var to_add = [];
    var to_delete = [];
    for (index in this._currentlySelected) {
      if (!selected_indexes[index]) {
        to_delete.push(index); 
      }
    }
    for (index in selected_indexes) {
      if (!this._currentlySelected[index]) {
        to_add.push(index); 
      }
    }
    for (var i = 0; i < to_add.length; i++) {
      index = to_add[i];
      this._currentlySelected[index] = 1;
      // this._selectionController.setSelection(index, true);
      console.log('set selection for index ' + index);
    }
    for (var i = 0; i < to_delete.length; i++) {
      index = to_delete[i];
      // this._selectionController.setSelection(index, false);
      delete this._currentlySelected[index];
      console.log('remove selection for index ' + index);
    }
  },

  _onSelectionDrag: function(e) {
    var rect = this._getRectForSelectionDrag(e);
    this._selectorDiv.style.top = rect.top + 'px';
    this._selectorDiv.style.left = rect.left + 'px';
    this._selectorDiv.style.width = rect.width + 'px';
    this._selectorDiv.style.height = rect.height + 'px';
    this._selectIndexesUnderRect(rect);
  },
  _onSelectionDragEnd: function(e) {
    this._view._dom.removeChild(this._selectorDiv);
    delete this._selectorDiv;
  }
  // 
  // _updateSelection: function(e) {
  //   var packs = this.childViews(),
  //       from = packs[0] ? packs[0].from : -1,
  //       to = packs.length ? packs[packs.length - 1].to :
  //           this.data().length,
  //       state = e.action == 'add';
  // 
  //   from = Math.max(from, e.from);
  //   to = Math.min(to, e.to);
  // 
  //   for (var i = to; i >= from; i--) {
  //     this._setSelected(i, state);
  //   }
  // },
  // 
  // _toggleselection: function(e) {
  //   this._triggerSelection();
  // }
});

exports.SelectionController = SelectionController;
