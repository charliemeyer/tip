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
     *  An Endscreen displays details about how the interview went, and
     *  provides an opportunity to replay it.
     *  @class
     *  @name  Endscreen
     */
    var Endscreen = declare(null, {
        /**
         *  @constructor
         *  @function
         *  @memberof Endscreen.prototype
         *  @param  {Object} args
         *  @param {string} [args.id="endscreen"] The id of the domNode to use
         *      for the endscreen.
         *  @todo It should instead take the parent node and create its own
         *      domNode within.
         */
        constructor: function (args) {
            args = args || {};
            this.domNode = dom.byId(args.id || "endscreen");
            this.hide();
        },

        /**
         *  Registers the provided editor so that its history will be played
         *  when the replay button is pressed.
         *  @memberof Endscreen.prototype
         *  @param  {Editor} editor
         */
        registerEditor: function (editor) {
            var self = this;
            on(dom.byId("replay-button"), "click", function () {
                self.hide();
                editor.show();
                editor.playback();
            });
        },

        /**
         *  Displays or un-hides the endscreen for the user.
         *  @memberof Endscreen.prototype
         */
        show: function () {
            domStyle.set(this.domNode, "display", "block");
        },

        /**
         *  Hides the endscreen from the user.
         *  @memberof Endscreen.prototype
         */
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
        }
    });

    return Endscreen;
});

