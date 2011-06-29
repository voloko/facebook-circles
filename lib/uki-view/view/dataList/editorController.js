var fun = require("../../../uki-core/function");
var build = require("../../../uki-core/builder").build;

var Observable = require("../../../uki-core/observable").Observable;


var EditorController = fun.newClass(Observable, {

  initWithView: function(view) {
    this._view = view;
  },

  editor: fun.newProp('editor'),

  editorRowIndex: fun.newProp('editorRowIndex'),

  editing: function() {
    return !!(this.editor() && this.editor().parent());
  },

  onstartEditing: function(e) {
    this.edit(this._view.selectedIndex());
  },

  edit: function(index) {
    var data = this._view.data().slice(index, index + 1)[0];
    if (!this.editor() || !data) { return this; }

    this.editor(build([this.editor()])[0]);
    this._onclose();

    var dimensions = this._view.metrics().rowDimensions(index);
    this._view.appendEditor(this.editor());

    this.editor()
      .on('close', fun.bindOnce(this._onclose, this))
      .on('move', fun.bindOnce(this._onmove, this))
      .pos({
        top: dimensions.top + 'px',
        left: 0 + 'px',
        right: 0 + 'px',
        height: dimensions.height + 'px'
      })
      .visible(true)
      .edit({ model: this._view.selectedRow(), modelProp: this._view.key() });

    this._editorRowIndex = index;
    this._view.lastClickIndex(index);
    return this;
  },

  _onclose: function(e) {
    if (!this.editing()) { return; }

    this.editor()
      .removeListener('move', fun.bindOnce(this._onmove, this))
      .removeListener('close', fun.bindOnce(this._onclose, this));

    fun.defer(
      fun.bind(this._view.redrawIndex, this._view, this._editorRowIndex));
    this._view.removeEditor(this.editor());
    if (e && e.remainFocused) { this._view.focus(); }
  },

  _onmove: function(e) {
    e.vertical = e.vertical || e.horizontal;
    var view = this._view;
    if (this._moveSelectedIndex(e.vertical)) {
      view.scrollToIndex(view.selectedIndex());
      view.triggerSelection();
      view.editSelected();
    }
  },

  _moveSelectedIndex: function(offset) {
    var selectedIndex = this._view.selectedIndex();
    var newIndex = selectedIndex + offset;
    newIndex = Math.min(newIndex, this._view.data().length - 1);
    newIndex = Math.max(0, newIndex);
    if (newIndex != selectedIndex) {
        this._view.selectedIndex(newIndex);
        return true;
    }
    return false;
  }
});


exports.EditorController = EditorController;
