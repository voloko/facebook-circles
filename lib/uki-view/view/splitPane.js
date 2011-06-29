requireCss("./splitPane/splitPane.css");


// force gesture load/registration
require("../../uki-core/gesture");

var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    dom   = require("../../uki-core/dom"),
    evt   = require("../../uki-core/event"),
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,

    Mustache     = require("../../uki-core/mustache").Mustache,
    PersistentState = require("../persistentState").PersistentState,
    Container    = require("../../uki-core/view/container").Container;


/**
* @class SplitPane
* @author voloko
* @version alpha
*/
var SplitPane = fun.newClass(Container, PersistentState, {}),
    proto = SplitPane.prototype;


proto.typeName = 'fb.SplitPane';

proto._throttle = 0; // do not try to render more often than every Xms
proto._handlePosition = 200;
proto._leftSpeed = 0;
proto._rightSpeed = 1;
proto._handleWidth = 1;
proto._leftMin = 100;
proto._rightMin = 100;
proto._vertical = false;

proto._setup = function(initArgs) {
    this._vertical = initArgs.vertical || this._vertical;
    this._handleWidth = initArgs.handleWidth || this._handleWidth;
    this._originalWidth = 0;
    this._exts = [];
    Container.prototype._setup.call(this, initArgs);
};

/**
* @function
* @name SplitPane#leftMin
*/
/**
* @function
* @name SplitPane#rightMin
*/
/**
* @function
* @name SplitPane#autogrowLeft
*/
/**
* @function
* @name SplitPane#autogrowRight
*/
/**
* @function
* @name SplitPane#throttle
*/
fun.addProps(proto, ['leftMin', 'rightMin', 'leftSpeed', 'rightSpeed',
    'throttle']);
proto.topMin = proto.leftMin;
proto.bottomMin = proto.rightMin;
proto.topSpeed = proto.leftSpeed;
proto.bottomSpeed = proto.rightSpeed;

/**
* @function
* @fires event:handleMove
* @name SplitPane#handlePosition
*/
fun.addProp(proto, 'handlePosition', function(val) {
    if (this._x_width()) {
        // store width after manual (drag or program) position change
        this._prevWidth = this._x_width();

        this._prevPosition = this._handlePosition =
            this._normalizeHandlePosition(val);
        // resize imidiately
        this.layout();
    } else {
        this._handlePosition = val;
    }
});

proto.getPersistentState = function() {
  return { handlePosition: this.handlePosition() };
};

proto.setPersistentState = function(state) {
  if (state.handlePosition) {
    this.handlePosition(state.handlePosition);
  }
};

proto.destruct = function() {
  PersistentState.destruct.call(this);
  Container.prototype.destruct.call(this);
};

proto._normalizeHandlePosition = function(pos) {
    // can't move to far to the right
    pos = Math.min(
        pos,
        this._x_width() - this.rightMin() - this.handleWidth());

    // can't move to far to the left
    pos = Math.max(pos, this.leftMin());
    return pos;
};

proto._moveHandle = function() {
    this._handle.style[this._x_leftName()] =
        this.handlePosition() + 'px';
};

/**
 * Positions of additional drag zones
 */
proto.extPositions = function(positions) {
    if (positions === undefined) {
        return this._exts.map(function(ext) {
            return this._styleToPos(ext.style);
        }, this);
    }

    this._exts.forEach(function(ext) {
        this._handle.removeChild(ext);
    }, this);

    this._exts = positions.map(function(pos) {
        var ext = dom.createElement('div', {
            className: 'splitPane-handle-ext'
        });
        pos = this._expandPos(pos);
        this._applyPosToStyle(pos, ext.style);
        this._handle.appendChild(ext);
        return ext;
    }, this);
    return this;
};

/**
* @function
* @name SplitPane#handleWidth
*/
proto.handleWidth = function() {
    return this._handleWidth;
};

proto.vertical = function() {
    return this._vertical;
};

/**
 * Treat all splitPanes as vertical (pane|pane)
 * Use _x_methods to adjust to horizontal layout
 */
proto._x_width = function() {
    return this.vertical() ? this.dom().offsetWidth :
        this.dom().offsetHeight;
};

proto._x_widthName = function() {
    return this.vertical() ? 'width' : 'height';
};

proto._x_leftName = function() {
    return this.vertical() ? 'left' : 'top';
};

proto._x_type = function() {
    return this.vertical() ? 'v' : 'h';
};

proto._x_xName = function() {
    return this.vertical() ? 'x' : 'y';
};

proto._createHandle = function() {
    var handle = dom.fromHTML(Mustache.to_html(
        requireText('splitPane/handle.html'),
        { type: this._x_type() }
    ));

    if (this.handleWidth() > 1) {
        handle.style[this._x_widthName()] = this.handleWidth() + 'px';
    } else {
        handle.className += ' ' + 'splitPane-handle_thin';
    }

    ['draggesturestart', 'draggesture',
        'draggestureend'].forEach(function(name) {
        evt.addListener(handle, name, fun.bind(this['_' + name], this));
    }, this);

    return handle;
};

proto._createDom = function() {
    this._dom = dom.createElement('div', { className: 'splitPane' });

    build([
        { view: Container,
            addClass: 'splitPane-container splitPane-container_left' },
        { view: Container,
            addClass: 'splitPane-container splitPane-container_right' }
    ]).appendTo(this);

    this._dom.appendChild(this._handle = this._createHandle());
};

proto._updateHandle = function(pos) {
    this._handlePosition =
        this._normalizeHandlePosition(pos);
    this._moveHandle();
    this._childViews[0].pos(this._leftPos()).layout();
    this._childViews[1].pos(this._rightPos()).layout();
};

proto._initLayout = function() {
    // store and forget
    this._prevWidth = this._x_width();
    this._prevPosition = this.handlePosition();
};

proto._layout = function() {
    this._updateHandle(this._calcDesiredPosition());
};

proto._calcDesiredPosition = function() {
    var newWidth = this._x_width(),
        diff = newWidth - this._prevWidth,
        totalSpeed = this.leftSpeed() + this.rightSpeed(),
        leftDiff = this.leftSpeed() / (totalSpeed || 1) * diff;

    return this._prevPosition + leftDiff;
};

proto._draggesturestart = function(e) {
    e.cursor = dom.computedStyle(this._handle, null).cursor;
    this._positionBeforeDrag = this.handlePosition();
};

proto._draggesture = function(e) {
    this._updatePositionOnDrag(e);
};

proto._draggestureend = function(e) {
    this._updatePositionOnDrag(e, true);
    // use new position as a base for next resize
    this._prevPosition = this.handlePosition();
    this._prevWidth = this._x_width();
};

proto._updatePositionOnDrag = function(e, stop) {
    var pos = this._positionBeforeDrag + e.dragOffset[this._x_xName()];
    this._updateHandle(pos);

    this.trigger({
        type: stop ? 'handleStop' : 'handleMove',
        target: this,
        handlePosition: this._handlePosition,
        dragPosition: pos
    });
};


/**
* @function
* @name SplitPane#topChildViews
*/
/**
* @function
* @name SplitPane#leftChildViews
*/
proto.topChildViews = proto.leftChildViews = function(views) {
    return this._childViewsAt(0, views);
};

/**
* @function
* @name SplitPane#rightChildViews
*/
/**
* @function
* @name SplitPane#bottomChildViews
*/
proto.bottomChildViews = proto.rightChildViews = function(views) {
    return this._childViewsAt(1, views);
};

proto._childViewsAt = function(i, views) {
    if (views === undefined) {
        return this._childViews[i].childViews();
    }
    this._childViews[i].childViews(views);
    return this;
};

proto._leftPos = function() {
    var pos = { left: '0px', top: '0px' };
    pos[this._x_widthName()] = this.handlePosition() + 'px';
    pos[this.vertical() ? 'bottom' : 'right'] = '0px';
    return pos;
};

proto._rightPos = function() {
    var pos = { bottom: '0px', right: '0px' };
    pos[this._x_leftName()] = this.handlePosition() + this.handleWidth() + 'px';
    pos[this.vertical() ? 'top' : 'left'] = '0px';
    return pos;
};


exports.SplitPane = SplitPane;
