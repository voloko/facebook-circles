var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var view  = require("../../../uki-core/view");
var dom   = require("../../../uki-core/dom");

var Mustache = require("../../../uki-core/mustache").Mustache;
var Base     = require("../../../uki-core/view/base").Base;


var Pack = view.newClass('dataList.Pack', Base, {

  _setup: function(initArgs) {
    this._data = [];
    return Base.prototype._setup.call(initArgs);
  },

  template: fun.newProp('template'),

  formatter: fun.newProp('formatter'),

  key: fun.newProp('key'),

  data: fun.newProp('data'),

  top: function(v) {
    if (arguments.length) {
      this.dom().style.top = v + 'px';
      return this;
    }
    return parseInt(this.dom().style.top, 10);
  },

  cache: function() {
    if (!this._cache) {
      this._cache = {};
      utils.forEach(this.data(), function(row, i) {
        this._cache[this._rowId(row)] = i;
      }, this);
    }
    return this._cache;
  },

  rowIndex: function(row) {
    var id = this._rowId(row);
    var cache = this.cache();
    return (id in cache) ? -1 : cache[id];
  },

  render: function(data, selectedInPack, globalIndex) {
    this._data = data;
    this._dom.innerHTML = this._toHTML(data, globalIndex);
    this._restorePackSelection(selectedInPack || [], globalIndex);
  },

  updateRow: function(index, isSelected, globalIndex) {
    var tmp = dom.createElement('div', {
      html: this._toHTML(this.data().slice(index, index + 1), globalIndex)
    });
    var item = this._rowAt(index);
    item.parentNode.replaceChild(tmp.childNodes[0], item);
    this.setSelected(index, isSelected);
  },

  setSelected: function(index, state) {
    if (this.dom()) {
      var row = this._rowAt(index);
      if (row) {
        dom.toggleClass(row, 'uki-dataList-row_selected', state);
      }
    }
  },

  _rowId: function(row) {
    return utils.prop(row, 'id');
  },

  _toHTML: function(data, globalIndex) {
    var formated = utils.map(data, function(row, index) {
      return this._formatRow(row, index, globalIndex);
    }, this);

    return Mustache.to_html(
      this.template(), { rows: formated }
    );
  },

  _formatRow: function(row, index, globalIndex) {
    index = index + globalIndex;
    var value = this.formatter()(
      this.key() ? utils.prop(row, this.key()) : row,
      row,
      index);

    return {
      value: value,
      row: row,
      index: index,
      even: index & 1
    };
  },

  _createDom: function(initArgs) {
    this._dom = dom.createElement('ul', {
      className: 'uki-dataList-pack'
    });
  },

  _restorePackSelection: function(selectedInPack, globalIndex) {
    for (var i = selectedInPack.length - 1; i >= 0; i--) {
      this.setSelected(selectedInPack[i] - globalIndex, true);
    }
  },

  _rowAt: function(index) {
    return this.dom().childNodes[index];
  }

});


exports.Pack = Pack;
