var Base = require('../lib/uki-view/view/dataGrid/selectionController').SelectionController;

var fun = require("../../../lib/uki-core/function");
var evt = require("../../../lib/uki-core/event");
var env = require("../../../lib/uki-core/env");

var SelectionController = fun.newClass(Base, {
  // initWithView: function(view) {
  //   this._view = view;
  //   // this._view._selection.on('update', fun.bind(this._updateSelection, this));
  // },
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
