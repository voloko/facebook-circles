/**
*/


var dom   = require("../uki-core/dom"),
    utils = require("../uki-core/utils"),
    evt   = require("../uki-core/event"),
    env   = require("../uki-core/env"),
    fun   = require("../uki-core/function");

var Registry = {
  items: []
};

evt.addListener(env.root, 'unload', function() {
  utils.invoke(Registry.items, 'storePersistentState');
});


var PersistentState = {
  persistent: fun.newProp('persistent', function(info) {
    if (this.persistent()) {
      this.clearPersistentState();
      Registry.items = utils.without(Registry.items, this);
    }

    if (info) {
      info = utils.extend({
        key: '',
        storage: global.localStorage
      }, info);
    }

    this._persistent = info;
    if (this.persistent()) {
      Registry.items.push(this);
    }

    this.restorePersistentState();
  }),

  storePersistentState: function() {
    if (this.persistent()) {
      this.persistent().storage.setItem(
        this.persistent().key,
        this.getPersistentState()
      );
    }
  },

  restorePersistentState: function() {
    if (this.persistent()) {
      var state = this.persistent().storage.getItem(
        this.persistent().key);
      state && this.setPersistentState(state);
    }
  },

  getPersistentState: function() {
    // abstract
  },

  setPersistentState: function(state) {
    // abstract
  },

  clearPersistentState: function() {
    if (this.persistent()) {
      this.persistent().storage.setItem(
        this.persistent().storage.key,
        undefined);
    }
  },

  destruct: function() {
    if (this.persistent()) {
      this.storePersistentState();
      Registry.items = utils.without(Registry.items, this);
    }
  }
};


exports.PersistentState = PersistentState;
exports.PersistentStateRegestry = Registry;
