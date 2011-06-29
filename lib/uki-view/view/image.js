
var fun = require("../../uki-core/function"),
    dom = require("../../uki-core/dom"),

    Base = require("../../uki-core/view/base").Base;

/**
* @class Image
* @author voloko
* @version draft
*/
var ImageView = fun.newClass(Base, {
    typeName: 'fb.Image',

    _createDom: function() {
        this._dom = dom.createElement('img', { className: 'image' });
    }
});

fun.delegateProp(ImageView.prototype, ['src', 'alt', 'title'], '_dom');


exports.Image = ImageView;
