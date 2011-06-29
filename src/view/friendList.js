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

var SearchFriends = require('../search').SearchFriends;

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
    
    var item = this;
    
    if (item) {
      this._card = view.byId('card');
      if (!this._card) {
        this._card = new DetailCard();
      }
      var card = this._card;
      if (this.cur_index && this.cur_index != this._indexByEvent(e)) {
        this._card.visible(false);
      }
      
      this.cur_index = this._indexByEvent(e);
      
      if (this._card && !this._card.visible()) {
        var o = this.clientRect();   
        var l = e.pageX;
        if (e.pageX*1 + 2*88 > o.width*1) {
          l = e.pageX*1 - 2*88;
        }
        
        var pos = { t: e.pageY, l: l };
        var obj = item.data()[this.cur_index];
        this.time_id = setTimeout(function() {
          card.fillUserInfo(obj, pos);
        }, 2000);
      }
    }
  },
  
  _onmouseout: function(e) {
    var index = this._indexByEvent(e);
    if (index != this.cur_index) {
      this._card.visible(false);
    }
    clearTimeout(this.time_id);
  },
  
  filterFriends: function(oldData, searchText) {
    newData = oldData.filter(SearchFriends.filterFriendsFun(searchText));
    this.data(newData);
  }
  
});

exports.FriendList = FriendList;
