var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var dom   = require("../../../uki-core/dom");

var Base =
  require("../dataList/selectionController").SelectionController;


var SelectionController = fun.newClass(Base, {
  _eventToIndex: function(e) {
    var o = this._view.clientRect();
    var y = e.pageY - o.top;
    var x = e.pageX - o.left;

    return Math.min(
      this._view.metrics().cellForPosition(x, y),
      this._view.data().length - 1);
  },

  _onkeyrepeat: function(e) {
    if (!this._view.hasFocus()) { return; }

    var selection = this._view.selection();
    var indexes = selection.indexes();
    var nextIndex = -1;

    if (e.which == 37 || e.keyCode == 37) { // LEFT
      nextIndex = Math.max(0, this._view.lastClickIndex() - 1);
      e.preventDefault();
    } else if (e.which == 39 || e.keyCode == 39) { // DOWN
      nextIndex = Math.min(
        this._view.data().length - 1,
        this._view.lastClickIndex() + 1);
      e.preventDefault();
    } else if (e.which == 38 || e.keyCode == 38) { // UP
      nextIndex = Math.max(
        0,
        this._view.lastClickIndex() - this._view.cellsPerRow());
      e.preventDefault();
    } else if (e.which == 40 || e.keyCode == 40) { // DOWN
      nextIndex = Math.min(
        this._view.data().length - 1,
        this._view.lastClickIndex() + this._view.cellsPerRow());
      if (nextIndex > this._view.data().length - 1) {
        nextIndex = -1;
      }
      e.preventDefault();
    }

    if (nextIndex > -1 && nextIndex != this._view._lastClickIndex) {
      if (e.shiftKey && this._view.multiselect()) {
        if (selection.isSelected(nextIndex)) {
          selection.removeRange(
            Math.min(nextIndex + 1, this._view.lastClickIndex()),
            Math.max(nextIndex - 1, this._view.lastClickIndex())
          );
        } else {
          selection.clear().addRange(
            Math.min(nextIndex, this._view.lastClickIndex()),
            Math.max(nextIndex, this._view.lastClickIndex())
          );
        }
      } else {
        selection.indexes([nextIndex]);
      }
      this._triggerSelection();
      this._view.scrollToIndex(nextIndex);
      this._view.lastClickIndex(nextIndex);
    }
  }
});


exports.SelectionController = SelectionController;
