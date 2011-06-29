requireCss('./app.css');

var utils = require('../lib/uki-core/utils');
var Builder = require('../lib/uki-core/builder').Builder;
var dom = require('../lib/uki-core/dom');
var evt = require('../lib/uki-core/event');

var Circle = require('model/circle').Circle;
var Friend = require('model/friend').Friend;

require('../lib/uki-core/gesture');

var builder = new Builder([
  utils.extend({},
    require('../lib/uki-core/view/container'),
    require('./view/friendList'),
    require('./view/splitPane'),
    require('./view/circleList'),
    require('./view/circle'),
    require('./view/detailCard')
  )
]);

var storage = {
  setItem: function(name, value) {
    localStorage[name] = JSON.stringify(value);
  },
  getItem: function(name) {
    var value = localStorage[name];
    return value && JSON.parse(value);
  }
};

var col = builder.build(
{ view: 'SplitPane',
  pos: 't:0 l:0 r:0 b:0',
  handlePosition: 500,
  persistent: { key: 'friendList', storage: storage },
  init: { handleWidth: 50 },
  topChildViews: [
    { view: 'Container',
      pos: 't:10px l:10px r:0 b:0px',
      addClass: 'friendList',
      childViews: [
        {
          view: 'FriendList',
          as: 'friendList',
          pos: 't:0px r:0px l:0px' },
          { view: 'DetailCard', id: 'card',
            pos: 'w:88px h:95px', visible: false }
      ] }
  ],
  bottomChildViews: [
    { view: 'Container',
      addClass: 'circleList__container',
      pos: 't:0 b:0 l:0 r:0',
      childViews: [
        { view: 'CircleList', as: 'circleList',
          pos: 't:0 l:25px r:25px',
          childViews: [] }
      ] }
  ] }
).attach();

var circleList = col.view('circleList');
var friendList = col.view('friendList');

// global drag handler
evt.on(document.body, 'mousemove', function(e) {
  circleList.onmouseover(e);
});
evt.on(document.body, 'itemdrag', function(e) {
  circleList.ondragover(e);
});
evt.on(document.body, 'itemdragend', function(e) {
  circleList.ondrop(e);
});

require('../lib/uki-core/dom').createStylesheet(__requiredCss);

window.startApp = function() {
  Friend.load(function(friends) {
    friendList.data(friends);
  });
  Circle.load(function(circles) {
    circleList.data(circles);
  });
};
