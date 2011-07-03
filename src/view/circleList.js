requireCss('./circleList/circleList.css');

var Base = require('../../lib/uki-view/view/list').List;
var view = require('../../lib/uki-core/view');
var utils = require('../../lib/uki-core/utils');
var fun = require('../../lib/uki-core/function');
var Circle = require('./circle').Circle;
var dom = require('../../lib/uki-core/dom');

// var DragController = require('./circleList/dragController').DragController;

var CircleList = view.newClass('CircleList', Base, {
  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);
    this.horizontal(true).addClass('circleList').spacing('none');
    this.on('draggesture', this._ondraggesture);
    this.on('draggesturestart', this._ondraggesturestart);
    this.on('draggestureend', this._ondraggestureend);
  },

  friendCircleFeedback: fun.newProp('feedback'),

  _repositionCircleFriendForDrag: function(e) {
    var top = e.pageY;
    var left = e.pageX;
    this.friendCircleFeedback().style.left = left + 'px';
    this.friendCircleFeedback().style.top = top+ 'px';
  },

  _ondraggesture: function(e) {
    if (this._dragging) {
      this._repositionCircleFriendForDrag(e);
    }
  },

  _ondraggesturestart: function(e) {
    var target = e.target;
    var circle_index = this._itemUnderCursor(e);

    if (circle_index === null) { return; }
    if (!e.targetView().memberId || !e.targetView().memberId()) {
      return;
    }

    this._itemDrag = {
      circleIndex: circle_index,
      view: e.targetView()};
    this._dragging = true;

    // the DOM element showing the circle the user is dragging.
    var feedback = target.cloneNode(true);

    // ... add a css class
    dom.addClass(feedback, 'circleList__dragFeedback brian_blah');

    // append it to the dom
    document.body.appendChild(feedback);

    // store it.
    this.friendCircleFeedback(feedback);

    // set its position
    var rect = e.targetView().clientRect(true);
    var left = rect.left - e.pageX;
    var top = rect.top - e.pageY;
    this.friendCircleFeedback().style.marginLeft = left + 'px';
    this.friendCircleFeedback().style.marginTop = top + 'px';
    // why is this necessary?  it's in the css.
    this.friendCircleFeedback().style.opacity = 100;
    this._repositionCircleFriendForDrag(e);
  },

  _ondraggestureend: function(e) {
    if (this._dragging) {
      document.body.removeChild(this.friendCircleFeedback());
      this.friendCircleFeedback(null);
      if (this._itemDrag && 
          this._itemDrag.view && 
          this._itemDrag.view.memberId()) {
        var from_circle_index = this._itemDrag.circleIndex;
        var member_id = this._itemDrag.view.memberId();
        if (this._itemUnderCursor(e) != from_circle_index) {
          // remove the member_id from the "from_circle"
          this.childViews()[from_circle_index].model().removeMemberId(member_id);
          if (this._itemUnderCursor(e)) {
            // add the member_id to the "to_circle" 
            var to_circle_index = this._itemUnderCursor(e);
            var to_circle = this.childViews()[to_circle_index];
            to_circle.model().addMemberIds([member_id]);
          }
        } 

      }
      this._dragging = false;
    }
  },

  data: fun.newProp('data', function(d) {
    this._data = d;
    this.childViews([]);
    var circles = d.map(function(item) {
      return { view: Circle, model: item };
    });
    circles.unshift({ view: Circle, tmp: true });
    this.childViews(circles);
  }),

  _itemUnderCursor: function(e) {
    if (!this.childViews()) {
      return undefined;
    }

    var rect = this.clientRect(true);
    if (rect.top < e.pageY && rect.left < e.pageX &&
      rect.top + rect.height > e.pageY && rect.left + rect.width > e.pageX) {
        var child = this.firstChild().dom().parentNode;
        var x = e.pageX - rect.left;
        var y = e.pageY - rect.top;
        var width = child.offsetWidth;
        var height = child.offsetHeight;
        var row = y / height << 0;
        var cell = x / width << 0;
        var centerY = row * height + height/2;
        var centerX = cell * width + width/2;
        var dist = (centerX - x)*(centerX - x) + (centerY - y)*(centerY - y);
        var number = row * (this.dom().clientWidth/width << 0) + cell;
        var child = this.childViews()[number];
        if (child && dist < child.d()*child.d()) {
          return number;
        }
    }
    return undefined;
  },

  onmouseover: function(e) {
    var index = this._itemUnderCursor(e);

    if (this._overIndex !== index) {
      if (this._overIndex !== undefined) {
        this.childViews()[this._overIndex].over(false);
      }
      if (index !== undefined) {
        this.childViews()[index].over(true);
      }
      this._overIndex = index;
    }
  },

  ondragover: function(e) {
    this.onmouseover(e);
  },

  ondrop: function(e) {
    if (this._overIndex !== undefined) {
      var ids = utils.pluck(e.data, 'id');
      this.childViews()[this._overIndex].model().addMemberIds(ids);
      return true;
    }
    return false;
  }
});

exports.CircleList = CircleList;