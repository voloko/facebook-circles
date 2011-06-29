requireCss("./editor/editor.css");



var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var view  = require("../../../uki-core/view");
var build = require("../../../uki-core/builder").build;

var Container = require("../../../uki-core/view/container").Container;

var TextInput = require("../textInput").TextInput;


var Editor = view.newClass('fb.dataList.Editor', Container, {

  bindingOptions: fun.newProp('bindingOptions'),
  _bindingOptions: {},

  _createDom: function(initArgs) {
    Container.prototype._createDom.call(this, initArgs);
    this._createInput();

    this.on('blur', fun.bind(this.finishEditing, this, false));
    this.on('keydown', this._onkeydown);
    this.on('keyup', this._onkeyup);
    this.on('mousedown', function(e) { e.stopPropagation(); });

    this.addClass('uki-dataList-editor');
  },

  _createInput: function() {
    this._input = build({
      view: TextInput,
      addClass: 'uki-dataList-editor-input'
    }).appendTo(this)[0];
  },

  _onkeyup: function(e) {
    if (e.which == 13) { // RETURN
      this.finishEditing(true);
    } else if (e.which == 27) { // ESC
      this._input.value(this._originalValue);
      this.finishEditing(true);
    }
  },

  _onkeydown: function(e) {
    if (e.which == 38) { // UP or DOWN
      this.trigger({
        type: 'move',
        vertical: -1,
        horizontal: 0
      });
    } else if (e.which == 40) {
      this.trigger({
        type: 'move',
        vertical: 1,
        horizontal: 0
      });
    } else if (e.which == 9) {
      this.trigger({
        type: 'move',
        vertical: 0,
        horizontal: e.shiftKey ? -1 : 1
      });
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  },

  edit: function(binding) {
    this._editing = true;
    this._input.binding(utils.extend(binding, this.bindingOptions()));
    this._originalValue = this._input.binding().viewValue();
    this._input.select();
  },

  finishEditing: function(remainFocused) {
    if (!this._editing) { return; }
    this._editing = false;
    this._input.trigger({ type: 'blur' });
    this._input.binding(null);
    this.trigger({
      type: 'close',
      remainFocused: remainFocused
    });
  },

  domForEvent: function(type) {
    return this._input.dom();
  }
});


exports.Editor = Editor;
