/**
* Copyright (c) 2010 Vladimir Kolesnikov, ukijs
*/

var fun   = require('./function'),
    utils = require('./utils'),
    Observable = require('./observable').Observable;

/**
 * Search with chunks
 *
 * Campaign/Ad class need to implements match
 */

var CHUNK_SIZE = 100;
var CHUNK_TIMEOUT = 20;
Searcher = fun.newClass(Observable, {
  init : function(data) {
    this.items = data;
  },

  updateData: function(data) {
    this.items = data;
  },

  search: function(query, callback) {
    this._stopSearch();

    this._query = query;
    var iterator = this._createIterator(query, callback);

    this.trigger({
      type: 'searchStart',
      iterator: iterator
    });

    this._filterChunk(iterator);
  },

  _createIterator: function(query, callback) {
    return {
      query: query,
      iteration: 0,
      found: 0,
      callback: callback
    };
  },

  _filterChunk: function(iterator) {
    var filtered = 0,
        foundInChunk = [],
        item;

    while (iterator.iteration < this.items.length) {
      if (filtered == CHUNK_SIZE) {
        if (foundInChunk.length) {
          this.trigger({
            type: 'searchFoundInChunk',
            foundInChunk: foundInChunk
          });
        }

        this._searchTimer = setTimeout(fun.bind(function() {
          this._filterChunk(iterator);
          }, this), CHUNK_TIMEOUT
        );
        return;
      }
      item = this.items[iterator.iteration];

      // we expect the item's class (ad, campaign etc)
      // to have the match implemented
      if (item && item.match(iterator.query)) {
        iterator.found++;
        foundInChunk.push(item);

        if (iterator.callback) {
          iterator.callback(item, iterator);
        }
      }

      iterator.iteration++;
      filtered++;
    }

    this.trigger({
      type: 'searchFoundInChunk',
      foundInChunk: foundInChunk
    });

    this._stopSearch();
    this.trigger({
      type: 'searchFinish',
      iterator: iterator
    });
  },

  _stopSearch: function() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer);
      this._searchTimer = false;
    }
  }
});

exports.Searcher = Searcher;
