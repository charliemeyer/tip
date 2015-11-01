define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!js/templates/infobar.html"
    ], function (
        declare,
        _WidgetBase,
        _TemplatedMixin,
        infobarTemplateString
    ) {


    /**
     *  An InfoBar is a place for displaying important info.
     *  @class
     *  @name  InfoBar
     *  @extends dijit._WidgetBase
     */
    var InfoBar = declare([_WidgetBase, _TemplatedMixin], {
        templateString: infobarTemplateString,

        postCreate: function () {
            this.set("content", "&nbsp;");
        },

        _setContentAttr: function (content) {
            this.domNode.innerHTML = content;
        }
    });

    return InfoBar;
});
