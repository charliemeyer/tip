define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom",
        "dojo/dom-style",
        "dojo/on",
        "js/lodash"
    ], function (
        declare,
        lang,
        dom,
        domStyle,
        on,
        _
    ) {

    /**
     *  An Endscreen displays details about how the interview went.
     */
    var Endscreen = declare(null, {
        constructor: function (args) {
            args = args || {};
            this.domNode = dom.byId(args.id || "endscreen");
            this.hide();
        },

        registerEditor: function (editor) {
            var self = this;
            on(dom.byId("replay-button"), "click", function () {
                self.hide();
                editor.show();
                editor.playback();
            });
        },

        show: function () {
            domStyle.set(this.domNode, "display", "block");
        },

        hide: function () {
            domStyle.set(this.domNode, "display", "none");
        }
    });

    return Endscreen;
});

