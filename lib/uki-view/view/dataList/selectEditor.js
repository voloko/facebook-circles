var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var build = require("../../../uki-core/builder").build;
var view  = require("../../../uki-core/view");

var Editor = require("./editor").Editor;
var Select = require("../select").Select;


var SelectEditor = view.newClass('fb.dataList.SelectEditor', Editor, {
  edit: function(binding) {
    this._editing = true;
    this._input.binding(utils.extend(binding, this.bindingOptions()));
    this._originalValue = this._input.binding().viewValue();
    this._input.focus();
  },

  options: fun.newDelegateProp('_input', 'options'),

  _createInput: function() {
    this.addClass('uki-dataList-selectEditor');
    this._input = build({
      view: Select,
      addClass: 'uki-dataList-editor-input'
    }).appendTo(this)[0];
  },

  _keydown: function(e) {
    if (e.which == 40 || e.which == 38) {
      e.stopPropagation();
    } else {
      Editor.prototype._keydown.call(this, e);
    }
  }
});


exports.SelectEditor = SelectEditor;
