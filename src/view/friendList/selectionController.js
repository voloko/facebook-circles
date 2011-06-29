
var dom = require('../../../lib/uki-core/dom');
var fun = require("../../../lib/uki-core/function");
var evt = require("../../../lib/uki-core/event");
var env = require("../../../lib/uki-core/env");

var SelectionController = fun.newClass({
  initWithView: function(view) {
    this._view = view;
    this._view.on('selectiondragstart', 
     fun.bind(this._onSelectionDragStart, this));
    this._view.on('selectiondrag', 
     fun.bind(this._onSelectionDrag, this));
    this._view.on('selectiondragend', 
     fun.bind(this._onSelectionDragEnd, this));

    this._view.on({
      'mousedown': fun.bind(this._onmousedown, this),
    });
  },

  _onmousedown: function(e) {
    if (dom.hasClass(e.target, 'uki-dataList') || dom.hasClass(e.target, 'uki-dataList-pack')) {
      this._view.selection().clear();
    } else {
      var index = this._eventToIndex(e);
      var selection = this._view.selection();
      selection.toggle(index);
    } 
  },

  _eventToIndex: function(e) {
    var o = this._view.clientRect();
    var y = e.pageY - o.top;
    var x = e.pageX - o.left;

    return Math.min(
      this._view.metrics().cellForPosition(x, y),
      this._view.data().length - 1);
  },
  
  _onSelectionDragStart: function(e) {
    this._view.selection().clear();
    this._selectorDiv = dom.createElement('div', {
      style: 'position:absolute; opacity: 0.3;'
      });
    this._selectorDiv.style.backgroundColor = '#4ea7df';
    this._selectorDiv.style.border = '2px solid black';
    this._selectorDiv.style.top = e.offsetY + 'px';
    this._selectorDiv.style.left = e.offsetX + 'px';
    this._selectorDiv.style.width = '1px';
    this._selectorDiv.style.height = '1px';
    var client_rect = this._view.clientRect();
    this._selectorDivStart = {
      x: e.pageX - client_rect.left, y: e.pageY - client_rect.top};
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

  _getIndexesUnderRect: function(rect) {
    var start_index = this._view.metrics().cellForPosition(rect.left, rect.top);
    var start_dimensions = this._view.metrics().cellDimensions(start_index);
    var offset = 20;
    if (rect.left > start_dimensions.offset + start_dimensions.width - offset) {
      start_index++;
      var start_dimensions_new = this._view.metrics().cellDimensions(start_index);
      if (start_dimensions_new.offset < start_dimensions.offset) {
        return [];
      }
    }

    var end_index = this._view.metrics().cellForPosition(
      rect.left + rect.width, rect.top + rect.height)
    var end_dimensions = this._view.metrics().cellDimensions(end_index);
    if (rect.left > end_dimensions.offset + end_dimensions.width - offset) {
      end_index++;
    }

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
    return selected_indexes;
  },

  _selectIndexesUnderRect: function(rect) {
    var selected_indexes = this._getIndexesUnderRect(rect);
    var index;

    var to_add = [];
    var to_delete = [];
    for (index in this._currentlySelected) {
      index *= 1;
      if (!selected_indexes[index]) {
        to_delete.push(index); 
      }
    }
    for (index in selected_indexes) {
      index *= 1;
      if (!this._currentlySelected[index]) {
        to_add.push(index); 
      }
    }
    for (var i = 0; i < to_add.length; i++) {
      index = to_add[i];
      this._currentlySelected[index] = 1;
      this._view.selection().addRange(index, index);
    }
    for (var i = 0; i < to_delete.length; i++) {
      index = to_delete[i];
      delete this._currentlySelected[index];
      this._view.selection().removeRange(index, index);
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
});

exports.SelectionController = SelectionController;
