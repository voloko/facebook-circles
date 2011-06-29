
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

  _getIndexesUnderRect: function(rect) {
    var metrics = this._view.metrics();
    var width = metrics._cellWidth;
    var height = metrics._cellHeight;
    var cellsPerRow = metrics.cellsPerRow();
    var x1 = ((rect.left + 25) / width) << 0;
    var y1 = ((rect.top + 20) / height) << 0;
    var x2 = Math.ceil((rect.left + rect.width) / width);
    var y2 = Math.ceil((rect.top + rect.height) / height);
    x1 = Math.min(x1, cellsPerRow);
    x2 = Math.min(x2, cellsPerRow);
    
    var indexes = [];
    for (var row = y1; row < y2; row++) {
      for (var cell = x1; cell < x2; cell++) {
        indexes[row*cellsPerRow + cell] = true;
      }
    }
    return indexes;
  },

  _selectIndexesUnderRect: function(rect) {
    var selected_indexes = this._getIndexesUnderRect(rect);
    var index;

    var to_add = [];
    var to_delete = [];
    for (var index in this._currentlySelected) {
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
