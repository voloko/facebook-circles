requireCss("./list/list.css");


var utils = require("../../uki-core/utils"),
    fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view"),

    Container = require("../../uki-core/view/container").Container;


/**
* @class List
* @author voloko
* @version alpha
*/
var List = fun.newClass(Container, {
    typeName: 'fb.List',

    spacing: view.newClassMapProp({
        none: 'list_spacing-none',
        small: 'list_spacing-small',
        medium: 'list_spacing-medium',
        large: 'list_spacing-large'
    }),

    border: view.newClassMapProp({
        none: 'list_border-none',
        light: 'list_border-light',
        medium: 'list_border-medium',
        dark: 'list_border-dark'
    }),

    horizontal: view.newToggleClassProp('list_horizontal'),

    _createDom: function() {
        this._dom = dom.createElement(
            'ul',
            { className: 'list list_spacing-small list_border-none' });
    },

    /* Wrap children in lis */
    _removeChildFromDom: function(child) {
        this.dom().removeChild(child.dom().parentNode);
    },

    _appendChildToDom: function(child) {
        var listClass = utils.prop(child, 'listRowClass');
        var li = dom.createElement(
            'li',
            { className: 'list-item' + (listClass ? ' ' + listClass : '') });

        li.appendChild(child.dom());
        this.dom().appendChild(li);
    },

    _insertBeforeInDom: function(child, beforeChild) {
        this.dom().insertBefore(
            child.dom().parentNode,
            beforeChild.dom().parentNode
        );
    }
});


exports.List = List;
