requireCss('./splitPane/splitPane.css');

var Base = require('../../lib/uki-view/view/splitPane').SplitPane;
var fun = require('../../lib/uki-core/function');
var dom = require('../../lib/uki-core/dom');
var evt = require('../../lib/uki-core/event');
var Mustache = require('../../lib/uki-core/mustache').Mustache;


var SplitPane = fun.newClass(Base, {
  _createHandle: function() {
    var handle = dom.fromHTML(Mustache.to_html(
      requireText('splitPane/handle.html'),
      { type: this._x_type() }
    ));

    handle.style[this._x_widthName()] = this.handleWidth() + 'px';

    ['draggesturestart', 'draggesture', 'draggestureend'].forEach(function(name) {
      evt.addListener(handle, name, fun.bind(this['_' + name], this));
    }, this);

    return handle;
  }
});

exports.SplitPane = SplitPane;