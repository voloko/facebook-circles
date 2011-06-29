requireCss('./friendList/friendList.css');

var Base = require('../../lib/uki-view/view/dataGrid').DataGrid;
var fun = require('../../lib/uki-core/function');
var utils = require('../../lib/uki-core/utils');
var dom = require('../../lib/uki-core/dom');
var view = require('../../lib/uki-core/view');
var evt = require('../../lib/uki-core/event');
var Mustache = require('../../lib/uki-core/mustache').Mustache;

var Selection  = require("../../lib/uki-view/view/dataList/selection").Selection;

var DragController = require('./friendList/dragController').DragController;
var SelectionController = require("./friendList/selectionController").SelectionController;
var view  = require("../../lib/uki-core/view");
var DetailCard = require('./detailCard').DetailCard;

var DRAG_OFFSET = 5;

var template = requireText('friendList/person.html');
var FriendList = view.newClass('FriendList', Base, {
  
  _template: requireText('friendList/friendListCell.html'),
  
  _formatter: function(object) {
    return Mustache.to_html(template, object);
  },
  
  _setup: function(initArgs) {
    initArgs.selectionController = new SelectionController();
    Base.prototype._setup.call(this, initArgs);
    
    this._dragController = 'dragController' in initArgs ?
      initArgs.dragController : new DragController();
  },
  
  domForIndex: function(index) {
    var pack = this._packFor(index);
    return pack && pack._rowAt(index - pack.from);
  },

  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);
    this.on('draggesture', this._ondraggesture);
    this.on('draggesturestart', this._ondraggesturestart);
    this.on('draggestureend', this._ondraggestureend);
    this.on('mouseover', this._onmouseover);
    this.on('mouseout', this._onmouseout);
    
    this._dragController.initWithView(this);
  },
  
  _ondraggestureend: function(e) {
    if (this._selecting) {
      this.trigger(evt.createEvent(e, { type: 'selectiondragend' }));
    }
    if (this._dragging) {
      this.trigger(evt.createEvent(e, utils.extend(
        { type: 'itemdragend', data: this.selectedRows() }, this._itemdrag)));
    }
    this._dragging = this._selecting = false;
  },

  _ondraggesture: function(e) {
    if (this._selecting) {
      this.trigger(evt.createEvent(e, { type: 'selectiondrag' }));
      return;
    }

    if (!this._dragging) {
      var o = e.dragOffset;
      this._dragging = o.x*o.x + o.y*o.y > DRAG_OFFSET*DRAG_OFFSET;
      if (this._dragging) {
        this.trigger(evt.createEvent(e, utils.extend({ type: 'itemdragstart' }, this._itemdrag)));
      }
    }
    if (this._dragging) {
      this.trigger(evt.createEvent(e, utils.extend({ type: 'itemdrag' }, this._itemdrag)));
    }
  },

  _ondraggesturestart: function(e) {
    var target = e.target;
    
    if (dom.hasClass(e.target, 'uki-dataList') || dom.hasClass(e.target, 'uki-dataList-pack')) {
      this._selecting = true;
      this._dragging = true;
      this.trigger(evt.createEvent(e, { type: 'selectiondragstart' }));
    } else {
      var o = this.clientRect();
      var y = e.pageY - o.top;
      var x = e.pageX - o.left;

      var index = Math.min(
        this.metrics().cellForPosition(x, y),
        this.data().length - 1);

      var d = this.metrics().cellDimensions(index);
        
      this._itemdrag = {
        index: index,
        offset: {
          x: d.offset - x,
          y: d.top - y
        }
      };
    }
  },
  
  _indexByEvent: function(e) {
    var o = this.clientRect();
    var y = e.pageY - o.top;
    var x = e.pageX - o.left;

    var index = Math.min(
      this.metrics().cellForPosition(x, y),
      this.data().length - 1);
      
    return index;
  },
  
  _onmouseover: function(e) {
    if (this._selecting || this._dragging) {
      clearTimeout();
      this._card.visible(false);
      return;
    }
    
    var item = e.targetView();
    
    if (item) {
      this._card = view.byId('card');
      if (!this._card) {
        this._card = new DetailCard();
      }
      var card = this._card;
      this.cur_index = this._indexByEvent(e);
      
      if (this._card && !this._card.visible()) {      
        var pos = { t: e.pageY, l: e.pageX };
      
        var obj = item.data()[this.cur_index];
        this.time_id = setTimeout(function() {
          card.fillUserInfo(obj, pos);
        }, 2000);
      }
    }
  },
  
  _onmouseout: function(e) {
    this._card.visible(false);
    clearTimeout(this.time_id);
  },

  onSelectionDragStart: function(e) {
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
    this._dom.appendChild(this._selectorDiv);
    this._currentlySelected = {};
    //console.debug(this._selectionController);
    /*
    console.debug('selection drag start');
    console.debug(e);
    console.debug(e.offsetX);
    console.debug(e.offsetY);
    */
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
    var start_index = this.metrics().cellForPosition(rect.left, rect.top);

    var end_index = this.metrics().cellForPosition(
      rect.left + rect.width, rect.top + rect.height)

    var cells_per_row = this.metrics().cellsPerRow();
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
      // this._selectionController.setSelection(index, true);
      index = to_add[i];
      this._currentlySelected[index] = 1;
      console.log('set selection for index ' + index);
    }
    for (var i = 0; i < to_delete.length; i++) {
      index = to_delete[i];
      // this._selectionController.setSelection(index, false);
      delete this._currentlySelected[index];
      console.log('remove selection for index ' + index);
    }
  },

  onSelectionDrag: function(e) {
    var rect = this._getRectForSelectionDrag(e);
    this._selectorDiv.style.top = rect.top + 'px';
    this._selectorDiv.style.left = rect.left + 'px';
    this._selectorDiv.style.width = rect.width + 'px';
    this._selectorDiv.style.height = rect.height + 'px';
    this._selectIndexesUnderRect(rect);
    //console.debug('selection drag: ' + rect.width + ', ' + rect.height);
  },
  onSelectionDragEnd: function(e) {
    this._dom.removeChild(this._selectorDiv);
    delete this._selectorDiv;
    /*
    console.debug('selection drag end');
    */
  } 
});

exports.FriendList = FriendList;
