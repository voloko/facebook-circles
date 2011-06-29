
var fun = require('../lib/uki-core/function');
var utils = require('../lib/uki-core/utils');

var SearchFriends = {
  compareFriends: function(a,b) {
    if(a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
    return 0;
  },
  
  filterFriendsFun: function(searchText) {
    return function(friend, index, friendArray) {
      return (friend._name.search(new RegExp(searchText, 'i')) != -1);
    }
  }
};

exports.SearchFriends = SearchFriends;
