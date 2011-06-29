var fun = require("../../../uki-core/function");

var Base = require("../../../uki-core/binding").Binding;


var Binding = fun.newClass(Base, {

  modelEvent: 'change.item',

  init: function(options) {
    Base.prototype.init.call(this, options);
    if (this.sync !== false && this.model && this.view) {
      this.view.data(this.model);
    }
  },

  updateModel: function(e) {},

  updateView: function(e) {
    if (e && this.view.shouldRedrawOnPropChange(e.name)) {
      // force single rewrite during a script execution
      this._indexesToRedraw = this._indexesToRedraw || [];
      this._indexesToRedraw.push(e.index);
      fun.deferOnce(this._redrawIndexes, this);
    }
  },

  _redrawIndexes: function() {
    this._indexesToRedraw.forEach(function(index) {
      this.view.redrawIndex(index);
    }, this);
    this._indexesToRedraw = [];
  }

});


exports.Binding = Binding;
