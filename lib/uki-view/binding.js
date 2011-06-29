/**
*/


var fun = require("../uki-core/function"),

    Base = require("../uki-core/binding").Binding;


var Binding = fun.newClass(Base, {
    commitChangesViewEvent: 'blur',

    updateModel: function(e) {
        Base.prototype.updateModel.call(this, e);

        if (e && e.type == this.commitChangesViewEvent &&
            this.model.commitChanges) {

            this.model.commitChanges(this.modelProp);
        }
    }
});


exports.Binding = Binding;
