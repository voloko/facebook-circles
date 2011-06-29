requireCss('./detailCard/detailCard.css');

var Container = require('../../lib/uki-core/view/container').Container;
var fun = require('../../lib/uki-core/function');
var dom = require('../../lib/uki-core/dom');
var Friend = require('model/friend').Friend;

var DetailCard = fun.newClass(Container, {
  _createDom: function(initArgs) {
    Container.prototype._createDom.call(this, initArgs);

    this._name = dom.createElement('div', 
      { className: 'card__name', html: 'Name' });
      
    this._profileLink = dom.createElement('div', 
      { className: 'card__profile', html: '' });

    this._pic = dom.createElement('img', 
      { className: 'card__pic' });

    this._top = dom.createElement('div', 
      { className: 'card__top'},
      [this._name, this._profileLink, this._pic]);
    
    this._bottom = dom.createElement('div', 
      { className: 'card__bottom', html: 'Loading...'});
      
    this._dom = dom.createElement('div',
      { className: 'card' },
      [this._top, this._bottom]);
  },
  
  fillUserInfo: function(item, pos) {    
    this._name.innerHTML = item.name();
    this._pic.src = item.picture();
    this._bottom.innerHTML = '';
    this._profileLink.innerHTML = '';
    
    item.fetchExtraData(fun.bind(function(result) {
      this._bottom.innerHTML = result.work
        ? (result.work[0] ? result.work[0].employer.name : result.first_name) : result.first_name;

      this._profileLink.innerHTML = '<a class="card_link" href=' + result.link + '>Profile</a>'; 
    }, this));
    
    var new_pos = 't:' + pos.t + 'px l:' + pos.l + 'px';  
    this.pos(new_pos);
    this.visible(true);
    
    clearTimeout(this.time_id);
    this.time_id = setTimeout(fun.bind(function() {
      this.visible(false);
      this.clearFields();
    }, this), 5000);
  },
  
  clearFields: function() {
    this._name.innerHTML = '';
    this._pic.src = '';
    this._bottom.innerHTML = '';
    this._profileLink.innerHTML = '';
  }
});

exports.DetailCard = DetailCard;