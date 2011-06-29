requireCss('./circleList/circleList.css');

var Base = require('../../lib/uki-view/view/list').List;
var view = require('../../lib/uki-core/view');
var utils = require('../../lib/uki-core/utils');
var fun = require('../../lib/uki-core/function');
var Circle = require('./circle').Circle;

var CircleList = view.newClass('CircleList', Base, {
  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);
    this.horizontal(true).addClass('circleList').spacing('none');
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
    }
  }
});

exports.CircleList = CircleList;