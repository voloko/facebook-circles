var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var dom   = require("../../../uki-core/dom");

var Base = require("../dataList/pack").Pack;


var Pack = fun.newClass(Base, {
  _rowAt: function(index) {
    return this.dom().childNodes[index + 1];
  },

  _createDom: function(initArgs) {
    this._dom = dom.createElement('ul', {
      className: 'uki-dataList-pack uki-dataGrid-pack'
    });
  },

  setSelected: function(index, state) {
    if (this.dom()) {
      var row = this._rowAt(index);
      if (row) {
        dom.toggleClass(row, 'uki-dataGrid-cell_selected', state);
      }
    }
  },

  fillerWidth: function(width) {
    var node = this.dom().childNodes[0];
    if (arguments.length) {
      node && (node.style.width = width + 'px');
      return this;
    }
    return node && parseInt(node.style.width, 10);
  }
});



exports.Pack = Pack;
