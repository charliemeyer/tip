define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_OnDijitClickMixin",
        "dojo/text!sim/widgets/templates/endscreen.html",
        "dojo/dom",
        "dojo/dom-style",
        "dojo/on",
        "lib/lodash"
    ], function (
        declare,
        lang,
        _WidgetBase,
        _TemplatedMixin,
        _ClickMixin,
        endscreenTemplateString,
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
     *  @extends {dijit._WidgetBase}
     */
    var Endscreen = declare([_WidgetBase, _TemplatedMixin, _ClickMixin], {
        templateString: endscreenTemplateString,

        /**
         *  A reference to the editor that logged the user's info.
         *  It must be set before the endscreen can replay anything.
         *  @name  editor
         *  @memberOf Endscreen.prototype
         *  @type {Editor}
         */

        /**
         *  Replays the user's interview typing.
         *  @memberOf Endscreen.prototype
         *  @todo  THIS is surely where the media should get played, not
         *      the editor.
         */
        replay: function () {
            this.hide();
            this.editor.show();
            this.editor.playback();
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

