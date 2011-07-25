var fun = require('../lib/uki-core/function');
var Observable = require('../lib/uki-core/observable').Observable;

var Friend = require('./friend').Friend;

var Affiliation = fun.newClass(Observable, {

   init: function(data) {
    this.nid(data.nid);
    this.name(data.name);
    this.member_ids(data.members || []);
  },

  nid: Observable.newProp('nid'),

  name: Observable.newProp('name'),

  count: Observable.newProp('count'),

  member_ids: Observable.newProp('member_ids', function(v) {
    this._member_ids = v;
    this.count(v.length);
  }),

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
      }
    }, this);
    this.member_ids(ids);
    return this;
  },

  membersLoaded: function() {
    return !this.member_ids().length || this.members().length;
  },

});

Affiliation._cache;

Affiliation.byId = function(id) {
  return Affiliation._cache && Affiliation._cache[id];
};

Affiliation.compareFunction = function(a,b) {
  if (b.count() != a.count()) {
    return b.count() - a.count()
  } else if (b.name() > a.name()) {
    return -1;
  } else if (a.name() > b.name()) {
    return 1;
  } else {
	return 0;
  }
};

Affiliation.load = function(callback) {
  var query = FB.Data.query(
                'SELECT uid, affiliations FROM user
                WHERE uid IN (SELECT uid2 FROM friend WHERE uid1={0})',
                FB.getSession().uid);
  query.wait(function(rows) {
    Affiliation._cache = {};

    var ret = [];
    rows.forEach(function(row) {
      uid = row.uid;
      affs = row.affiliations;
      affs.forEach(function(aff) {
        stored_aff = Affiliation._cache[aff.nid];
        if (!stored_aff) {
          stored_aff = new Affiliation(aff);
          Affiliation._cache[aff.nid] = stored_aff;
          ret.push(stored_aff);
        }
        stored_aff.addMemberIds(new Array(uid));
      });
    });
    ret.sort(Affiliation.compareFunction);
    callback(ret);
  });
};

exports.Affiliation = Affiliation;
