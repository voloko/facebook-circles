var fun = require('../lib/uki-core/function');
var utils = require('../lib/uki-core/utils');
var Observable = require('../lib/uki-core/observable').Observable;
var Friend = require('./friend').Friend;


var Circle = fun.newClass(Observable, {

  init: function(data) {
    this.id(data.id);
    this.name(data.name);
    this.member_ids(data.members || []);
  },

  id: Observable.newProp('id'),

  name: Observable.newProp('name'),

  count: Observable.newProp('count'),

  member_ids: Observable.newProp('member_ids', function(v) {
    this._member_ids = v;
    this.count(v.length);
  }),

  save: function() {
    FB.api(
      '/me/friendlists',
      'post',
      { name: this.name() },
      fun.bind(function(result) {
        this.id(result.id);
        this.member_ids().forEach(function(id) {
          this.saveMemberId(id);
        }, this);
      }, this));
  },
  
  saveMemberId: function(id) {
    if (this.id()) {
      FB.api('/' + this.id() + '/members/' + id, 'POST', function() {});
    }
  },

  members: function() {
    var ret = [];
    this.member_ids().forEach(function(id) {
      var f = Friend.byId(id);
      if (f) ret.push(f);
    });

    return ret;
  },

  addMemberIds: function(newIds) {
    var map = {};
    var ids = this.member_ids();
    this.member_ids().forEach(function(id) {
      map[id] = true;
    });
    newIds.forEach(function(id) {
      if (!map[id]) {
        map[id] = true;
        ids.push(id);
        this.saveMemberId(id);
      }
    }, this);
    this.member_ids(ids);
    return this;
  },

  membersLoaded: function() {
    return !this.member_ids().length || this.members().length;
  }
});

Circle._cache;

Circle.byId = function(id) {
  return Circle._cache && Circle._cache[id];
};

Circle.load = function(callback) {
  FB.api('/', 'POST', {
    batch: [
      {
        method: "GET",
        relative_url: "me/friendlists",
        name: 'lists',
        omit_response_on_success: false},
      {
        method: "GET",
        relative_url: "members/?ids={result=lists:$.data..id}&fields=id"
      }
      ] },
    function(result) {
      var lists = JSON.parse(result[0].body).data;
      var members = JSON.parse(result[1].body);

      var ret = [];
      Circle._cache = {};

      lists.forEach(function(list) {
        list.members =
          members[list.id] ? utils.pluck(members[list.id].data, 'id') : [];
        var circle = new Circle(list);
        Circle._cache[circle.id()] = circle;
        ret.push(circle);
      });


      callback(ret);

    });
};

exports.Circle = Circle;
