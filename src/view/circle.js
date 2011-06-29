requireCss('./circle/circle.css');

var Container = require('../../lib/uki-core/view/container').Container;
var Img = require('../../lib/uki-view/view/image').Image;
var view = require('../../lib/uki-core/view');
var fun = require('../../lib/uki-core/function');
var dom = require('../../lib/uki-core/dom');

var FRIENDS_PER_CIRCLE = 12;

var CircleFriend = view.newClass('CircleFriend', Img, {
  _createDom: function(initArgs) {
    Img.prototype._createDom.call(this, initArgs);
    this.addClass('circleFriend');
  },

  index: fun.newProp('index', function(v) {
    this._index = v;
    var a = 2*Math.PI/FRIENDS_PER_CIRCLE*v;
    var R = 67;
    var x = Math.sin(a)*R;
    var y = -Math.cos(a)*R;
    this.dom().style.marginLeft = x - 15 + 'px';
    this.dom().style.marginTop = y - 15 + 'px';
  })
});

var Circle = view.newClass('Circle', Container, {
  _createDom: function(initArgs) {
    this._disk = dom.createElement('div',
      { className: 'circle__disk' });
    this._number = dom.createElement('div',
      { className: 'circle__number', html: '0' });
    this._name = dom.createElement('div',
      { className: 'circle__name', html: 'Circle name' });
    this._inner = dom.createElement('div',
      { className: 'circle__inner' },
      [this._name, this._number]);
    this._dom = dom.createElement('div',
      { className: 'circle' },
      [this._disk, this._inner]);
  },

  model: fun.newProp('model', function(model) {
    this._model = model;
    this.bindings([
      { model: model, viewProp: 'name', modelProp: 'name' },
      { model: model, viewProp: 'count', modelProp: 'count' }
    ]);
  }),

  name: function(v) {
    if (arguments.length) {
      this._name.innerHTML = dom.escapeHTML(v);
      return this;
    }
    return this._name.innerHTML;
  },

  count: function(v) {
    if (arguments.length) {
      this._number.innerHTML = dom.escapeHTML(v);
      this.childViews([]);
      this._initted = false;
      if (this.over()) this._initMembers();
      return this;
    }
    return this._number.innerHTML;
  },

  over: function(state) {
    var className = 'circle_over';
    if (state === undefined) { return this.hasClass(className); }
    if (state) {
      this._initMembers();
    }
    setTimeout(fun.bind(function() {
      this.toggleClass(className, state)
    }, this), 10);
    return this;
  },

  _initMembers: function() {
    if (this._initted) return;
    if (this.model() && this.model().membersLoaded()) {
      this._initted = true;
      var members = this.model().members().slice(0, FRIENDS_PER_CIRCLE);
      this.childViews(members.map(function(m, i) {
        return { view: CircleFriend, src: m.picture(), index: i };
      }));
    }
  },

  dragover: view.newToggleClassProp('circle_dragover'),

  d: function() {
    return this.over() ? 175 : 125;
  }
});

Circle.D = 125;
exports.Circle = Circle;
