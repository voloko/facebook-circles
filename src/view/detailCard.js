requireCss('./detailCard/detailCard.css');

var Container = require('../../lib/uki-core/view/container').Container;
var fun = require('../../lib/uki-core/function');
var dom = require('../../lib/uki-core/dom');


var DetailCard = fun.newClass(Container, {
  _createDom: function(initArgs) {
    Container.prototype._createDom.call(this, initArgs);

    this._name = dom.createElement('div', 
      { className: 'card__name', html: 'Name' });
    this._pic = dom.createElement('img', 
      { className: 'card__pic' });

    this._top = dom.createElement('div', 
      { className: 'card__top'},
      [this._name, this._pic]);
    
    this._bottom = dom.createElement('div', 
      { className: 'card__bottom', html: 'Networks'});
      
    this._dom = dom.createElement('div',
      { className: 'card' },
      [this._top, this._bottom]);
  },
  
  fillUserInfo: function(item, pos) {    
    this._name.innerHTML = item.name();
    this._pic.src = item.picture();
    this._bottom.innerHTML = item.id();
    var new_pos = 't:' + pos.t + 'px l:' + pos.l + 'px';  
    this.pos(new_pos);
    this.visible(true);
    
    clearTimeout(this.time_id);
    this.time_id = setTimeout(fun.bind(function() {
      this.visible(false);
    }, this), 3000);
  }
});

exports.DetailCard = DetailCard;