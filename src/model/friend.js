var fun = require('../lib/uki-core/function');
var Observable = require('../lib/uki-core/observable').Observable;


var Friend = fun.newClass(Observable, {

  init: function(data) {
    this.id(data.id);
    this.name(data.name);
    this.picture(data.picture);
  },

  id: Observable.newProp('id'),

  name: Observable.newProp('name'),

  picture: Observable.newProp('picture')

});

Friend._cache;

Friend.byId = function(id) {
  return Friend._cache && Friend._cache[id];
};

Friend.load = function(callback) {
  FB.api('/me/friends?fields=id,name,picture', function(result) {
    Friend._cache = {};
    
    var friends = result.data.map(function(f) {
      var friend = new Friend(f);
      Friend._cache[friend.id()] = friend;
      return friend;
    });

    callback(friends);
  });
};

exports.Friend = Friend;
