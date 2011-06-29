requireCss("./dataList/dataList.css");

var fun   = require("../../uki-core/function");
var utils = require("../../uki-core/utils");
var dom   = require("../../uki-core/dom");
var view  = require("../../uki-core/view");
var build = require("../../uki-core/builder").build;

var Metrics    = require("./dataList/metrics").Metrics;
var Selection  = require("./dataList/selection").Selection;
var Pack       = require("./dataList/pack").Pack;
var SelectionController =
  require("./dataList/selectionController").SelectionController;
var EditorController =
  require("./dataList/editorController").EditorController;
var Binding = require("./dataList/binding").Binding;

var Container = require("../../uki-core/view/container").Container;
var Focusable = require("./focusable").Focusable;


var DataList = view.newClass('DataList', Container, Focusable, {

  _setup: function(initArgs) {
    this._metrics = 'metrics' in initArgs ? initArgs.metrics : new Metrics();

    this._packView = 'packView' in initArgs ? initArgs.packView : Pack;

    this._selectionController = 'selectionController' in initArgs ?
      initArgs.selectionController : new SelectionController();

    this._editorController = 'editorController' in initArgs ?
      initArgs.editorController : new EditorController();

    this._selection = new Selection();

    this._data = [];
    this._rendered = {};

    this._wrappedUpdate = this._update;

    Container.prototype._setup.call(this, initArgs);

    this._selection.on('update',
      fun.bind(this._updateSelection, this));
    this._metrics.on('change.totalHeight',
      fun.bind(this._updateHeight, this));
  },

  selection: function() {
    return this._selection;
  },

  metrics: function() {
    return this._metrics;
  },

  selectionController: function() {
    return this._selectionController;
  },

  editorController: function() {
    return this._editorController;
  },

  _createDom: function(initArgs) {
    this._dom = dom.createElement('div', {
      className: 'uki-dataList uki-dataList_blured'
    });
    this.tabIndex(1);
    this.metrics().initWithView(this);
    this.selectionController() && this.selectionController().initWithView(this);
    this.editorController() && this.editorController().initWithView(this);
    this.textSelectable(false);
  },

  layout: function() {
    if (this._layoutBefore) {
      this._wrappedUpdate();
    } else {
      this._initLayout();
    }
    return this;
  },

  _initLayout: function() {
    if (this.data().length) {
      this.metrics().initLayout();
      this._updateHeight();
      this._initScrollableParent();
      this._update();
      this._layoutBefore = true;
    }
  },

  _initScrollableParent: function() {
    this.scrollableParent(this.parent());
  },

  reset: function() {
    this.childViews([]);
    this.selectedIndexes([]);
    this._layoutBefore = false;
    this.scrollableParent(null);
    fun.deferOnce(fun.bindOnce(this.layoutIfVisible, this));
    return this;
  },

  /**
  * Data to render. Data should provide one of the following simple API's:
  * 1. Sync: #slice(from, to) and #length. Any native JS array can do this.
  * 2. Async: #loadRange(from, to, callback), and length.
  *    Please note that syncronous data fetching like selectedRow will use
  *    #slice(from, to) anyway. So it might be worth to provide #slice to.
  *
  * Data may also provide #sampleRow property. It will be used to calculate
  * row hight if rowHeight is not provided.
  * If there's no sampleRow slice(0, 1)[0] will be used.
  */
  data: fun.newProp('data', function(data) {
    this._data = data;
    this.reset();
  }),

  _createBinding: function(options) {
    options = utils.extend(this.bindingOptions(), options);
    options.view = this;
    return new Binding(options);
  },


  /**
  * Scroll the parent so row at position gets into view
  */
  scrollToIndex: function(index) {
    var range = this._visibleRange();
    var dm    = this.metrics().rowDimensions(index);
    var maxY  = dm.top + dm.height;
    var minY  = dm.top;

    if (maxY >= range.to) {
      this.scrollableParent().scroll(0, maxY - range.to +
        // hackish overflow to compensate for bottom scroll bar
        (index === this.data().length - 1 ? 100 : 0)
      );
    } else if (minY < range.from) {
      this.scrollableParent().scroll(0, minY - range.from);
    }
    this._wrappedUpdate();
    return this;
  },

  template: fun.newProp('template'),
  _template: requireText('dataList/pack.html'),

  formatter: fun.newProp('formatter'),
  _formatter: dom.escapeHTML,

  key: fun.newProp('key'),
  _key: null,


  // Rendering strategy
  //
  //      ___/__\___
  //      \        /
  //       \      /              ______
  //      <|------|>            (      )
  //       |      |              \    /
  //       |      |             <<    >>
  //       |      |               |  |
  //      _|______|_              |  |
  //     /__________\           _/    \_
  //   _/____________\_        /________\
  //  /________________\      /__________\
  //  \________________/      \__________/
  //
  /**
   * Do not redraw more often then in value ms
   */
  throttle: fun.newProp('throttle', function(v) {
    this._throttle = v;
    wrapVisChanged.call(this, v, 'throttle');
  }),
  _throttle: 0,

  /**
   * Do redraw only after value ms after last scroll/update
   */
  debounce: fun.newProp('debounce', function(v) {
    this._debounce = v;
    wrapVisChanged.call(this, v, 'debounce');
  }),
  _debounce: 0,

  /**
   * When rendering DataList determines visible range. To reduce blinking
   * data list will try to prerender more rows than visible at the moment.
   *
   * Prerender specifies how far should the visible range be extended.
   * 1 means that rendering range is extended before and after visible range
   * for the whole visible height. Equaling to 3 vis heights to render.
   */
  prerender: fun.newProp('prerender'),
  _prerender: 1,

  deduceRowHeight: function() {
    var data = this.data();
    var sample = utils.prop(data, 'sampleRow') ||
      (data.slice && data.slice(0, 1)[0]) || '';
    var pack = this._createPack();

    this.appendChild(pack);
    pack.render([sample], [], 0);
    var rowHeight = pack.dom().offsetHeight;
    this.removeChild(pack);
    return rowHeight;
  },

  redrawIndex: function(index) {
    var pack = this._packFor(index);
    if (pack) {
      pack.updateRow(index - pack.from, this.isSelected(index), index);
    }
  },

  redrawRow: function(row) {
    var packs = this.childViews();
    for (var i = 0; i < packs.length; i++) {
      var pack = packs[i];
      var index = pack.rowIndex(row);
      if (index > -1) {
        var globalIndex = pack.from + index;
        pack.updateRow(index, this.isSelected(globalIndex), globalIndex);
        break;
      }
    }
  },

  shouldRedrawOnPropChange: function(propName) {
    return true;
  },

  _updateHeight: function() {
    this.dom().style.height = this.metrics().totalHeight() + 'px';
  },

  _scroll: function() {
    this._wrappedUpdate();
  },

  scrollableParent: fun.newProp('scrollableParent', function(v) {
    if (this._scrollableParent) {
      this._scrollableParent.removeListener(
        'scroll', fun.bindOnce(this._scroll, this));
    }
    this._scrollableParent = v;
    if (this._scrollableParent) {
      this._scrollableParent.on(
        'scroll', fun.bindOnce(this._scroll, this));
    }
  }),

  _visibleRange: function() {
    if (!this.scrollableParent()) {
      return { from: 0, to: 0 };
    }

    var rect = this.clientRect(true),
        parentRect = this.scrollableParent().clientRect(true),
        topOffset = rect.top - parentRect.top,
        height = parentRect.height - Math.max(0, topOffset),
        top = -Math.min(0, topOffset);

    return { from: top, to: top + height };
  },

  _rangeWithPrerender: function() {
    var range = this._visibleRange();
    var h = (range.to - range.from) * this.prerender();

    range.from = Math.max(0, range.from - h);
    range.to = Math.min(this.metrics().totalHeight(), range.to + h);
    return range;
  },

  _rowsToRender: function() {
    var rangeInPX = this._rangeWithPrerender();
    return this.metrics().rowsForRange(rangeInPX);
  },

  /**
   * Called when visible range or data changes. Renders data in packs.
   * A pack is:
   *   { from: 100, to: 200, dom: [Element] }
   * Creates new packs for not yet rendered ranges and removes obsolete
   * packs.
   */
  _update: function() {
    var rows = this._rowsToRender();
    // nothing to render, exit right away
    if (rows.from >= rows.to) { return; }

    var packs = this.childViews();
    var renderedRows = {
      from: packs[0] && packs[0].from,
      to: packs[0] && packs[packs.length - 1].to
    };
    var h = rows.to - rows.from;
    var i;

    // do nothing, everything is rendered as it should
    if (packs.length && renderedRows.from <= rows.from &&
      renderedRows.to >= rows.to) {
      return;

    // there are packs before visible rows
    } else if (packs.length && renderedRows.from <= rows.from) {
      // remove packs before visible rows
      i = 0;
      while (packs[i] && packs[i].to < rows.from) {
        this.removeChild(packs[i++]);
      }
      // update rows to start from last rendered row
      rows.from = this.childViews().length ? this.lastChild().to : rows.from;
      rows.to = Math.min(rows.from + h, this.data().length);

    // there are packs after visible rows
    } else if (packs.length && renderedRows.to >= rows.to) {
      // remove packs after visible rows
      i = packs.length - 1;
      while (packs[i] && packs[i].from > rows.to) {
        this.removeChild(packs[i--]);
      }
      // update rows to end before first rendered row
      rows.to = this.childViews().length ? this.firstChild().from : rows.to;
      rows.from = Math.max(rows.to - h, 0);

    // none of the rendered packs are in the visible rows
    } else {
      this.childViews([]);
    }

    this._scheduleRenderRows(rows);
  },

  _scheduleRenderRows: function(rows) {
    if (rows.to > rows.from) {
      var pack = this._scheduleRenderPack(rows);
      var packs = this.childViews();

      packs.push(pack);

      this._childViews = packs.sort(function(a, b) {
        return a.from - b.from;
      });
      this._childViews.forEach(function(pack, i) {
        pack._viewIndex = i;
      });
    }
  },

  _scheduleRenderPack: function(range) {
    var pack = this._createPack();
    pack.from = range.from;
    pack.to = range.to;
    this.appendChild(pack);
    this._positionPack(pack);

    function render(rows) {
      if (pack.destructed) { return; }
      this._renderPack(pack, rows);
    }

    if (this.data().loadRange) {
      this.data().loadRange(
        range.from, range.to,
        fun.bind(render, this)
      );
    } else {
      render.call(this, this.data().slice(range.from, range.to));
    }
    return pack;
  },

  _createPack: function() {
    var pack = new this._packView();
    return pack
      .template(this.template())
      .formatter(this.formatter())
      .key(this.key());
  },

  _renderPack: function(pack, rows) {
    var selectedInPack =
      this.selection().selectedInRange(pack.from, pack.to);

    pack.render(rows, selectedInPack, pack.from);
    return pack;
  },

  _positionPack: function(pack) {
    var firstRowD = this.metrics().rowDimensions(pack.from);
    var lastRowD = this.metrics().rowDimensions(pack.to - 1);
    pack.top(firstRowD.top);
    pack.fromPX = firstRowD.top;
    pack.toPX = lastRowD.top + lastRowD.height;
  },

  // store original version function so we can instance override
  // _update in throttle and debounce and then revert back
  domForEvent: function(type) {
    return Focusable._domForEvent.call(this, type) ||
      Container.prototype.domForEvent.call(this, type);
  },


  //  Selection
  //  _____________________________________________________
  //  |         |                                         |
  //  |         /                                         |
  //  |         \                                         |
  //  |         |                                         |
  //  |        (*)                                        |
  //  |      ((   ))                                      |
  //  |                                                   |
  //  |           @.@         @.@     @.@                 |
  //  |          (---)       (---)   (---)                |
  //  |_________(>---<)_____(>---<)_(>---<)_______________|
  //  |___________________________________________________|
  //  |      A                                            |
  //  |   << @ >>                                         |
  //  |      V                                            |
  //  |                                                   |
  isSelected: fun.newDelegateCall('_selection', 'isSelected'),

  selectedIndexes: fun.newDelegateProp('_selection', 'indexes'),

  selectedIndex: fun.newDelegateProp('_selection', 'index'),

  editOnEnter: fun.newDelegateProp('_selectionController', 'editOnEnter'),

  /**
  * Index of the row the user either clicked or used keyborad to focus on
  */
  lastClickIndex: fun.newProp('lastClickIndex'),

  multiselect: fun.newProp('multiselect'),

  /**
  * Actual row selected.
  *
  * Warning! This method will use #slice even for async data
  */
  selectedRow: function() {
    var index = this.selection().index();
    return index > -1 && this._data.slice(index, index + 1)[0];
  },

  /**
  * Array of the the rows selected
  *
  * Warning! This method will use #slice even for async data
  */
  selectedRows: function() {
    var result = [],
        indexes = this.selection().indexes();

    for (var i = 0, l = indexes.length; i < l; i++) {
      var item = this._data.slice(indexes[i], indexes[i] + 1)[0];
      if (item) { result.push(item); }
    }
    return result;
  },

  _updateSelection: function(e) {
    var packs = this.childViews(),
        from = packs[0] ? packs[0].from : -1,
        to = packs.length ? packs[packs.length - 1].to :
            this.data().length,
        state = e.action == 'add';

    from = Math.max(from, e.from);
    to = Math.min(to, e.to);

    for (var i = to; i >= from; i--) {
      this._setSelected(i, state);
    }
  },

  _setSelected: function(index, state) {
    var pack = this._packFor(index);
    if (pack) {
      pack.setSelected(index - pack.from, state);
    }
  },

  _packFor: function(index) {
    var packs = this.childViews(),
        pack, i, l;

    for (i = 0, l = packs.length; i < l; i++) {
      pack = packs[i];
      if (pack.from <= index && pack.to > index) {
        return pack;
      }
    }
    return null;
  },

  triggerSelection: function() {
    this.trigger({ type: 'selection', target: this });
    return this;
  },

  // Editing
  editor: fun.newDelegateProp('_editorController', 'editor'),

  edit: fun.newDelegateCall('_editorController', 'edit'),

  editing: fun.newDelegateCall('_editorController', 'editing'),

  onstartEditing: function(e) {
    return this.editorController() && this.editorController().onstartEditing(e);
  },

  appendEditor: function(editor) {
    this.dom().appendChild(editor.dom());
    editor.parent(this);
  },

  removeEditor: function(editor) {
    dom.removeElement(editor.dom());
    editor.parent(null);
  }


});

function wrapVisChanged(v, method) {
  if (v > 0) {
    this._wrappedUpdate = fun[method](this._update, v);
  } else {
    this._wrappedUpdate = this._update;
  }
}

require("../../uki-core/collection").Collection
.addProps([
    'data', 'throttle', 'debounce', 'template', 'formatter', 'key',
    'selection', 'selectedRows', 'selectedRow',
    'selectedIndexes', 'selectedIndex', 'lastClickIndex', 'multiselect'
])
.addMethods([
    'scrollToIndex', 'triggerSelection', 'redrawIndex', 'redrawRow'
]);

exports.DataList = DataList;
