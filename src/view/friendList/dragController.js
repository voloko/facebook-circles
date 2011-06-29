var fun   = require("../../../lib/uki-core/function");
var utils = require("../../../lib/uki-core/utils");
var dom   = require("../../../lib/uki-core/dom");

var DragController = fun.newClass({
  initWithView: function(view) {
    this._view = view;
    view.on({
      itemdragstart: fun.bind(this._ondragstart, this),
      itemdrag: fun.bind(this._ondrag, this),
      itemdragend: fun.bind(this._ondragend, this)
    });
  },
  
  feedback: fun.newProp('feedback'),
  
  _reposition: function(e) {
    this.feedback().style.left = e.pageX + 'px';
    this.feedback().style.top = e.pageY + 'px';
  },

  _ondragstart: function(e) {
    var index = e.index;
    var l = this._view.selectedIndexes().length;
    
    var feedback = this._view.domForIndex(e.index).cloneNode(true);
    dom.addClass(feedback, 'friendList__dragFeedback');
    if (l > 1) {
      feedback.appendChild(dom.createElement(
        'div', { 
          html: '<i class="friendList__dragFeedback__clip"></i><strong class="friendList__dragFeedback__number">' + l + ' friends</strong>', 
          className: 'friendList__dragFeedback__count' }));
    }
    this.feedback(feedback);
    
    feedback.style.marginLeft = e.offset.x + 'px';
    feedback.style.marginTop = e.offset.y + 'px';
    document.body.appendChild(feedback);
    this._reposition(e);
  },

  _ondrag: function() {
    this._reposition(e);
  },

  _ondragend: function() {
    if (this.feedback()) {
      document.body.removeChild(this.feedback());
      this.feedback(null);
    }
  }
});


exports.DragController = DragController;
