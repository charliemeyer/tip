define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!sim/widgets/templates/chatbox.html",

        "dojo/_base/fx",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/on",

        "lib/lodash"
    ], function (
        declare,
        _WidgetBase,
        _TemplatedMixin,
        chatboxTemplateString,
        fx,
        dom,
        domConstruct,
        domGeom,
        domStyle,
        on,
        _
    ) {

    /**
     *  A ChatBox class keeps a list of messages that scroll up from the
     *  bottom.  Messages fade out after some time.
     *  @class
     *  @name  ChatBox
     *  @extends {dijit._WidgetBase}
     */
    var ChatBox = declare([_WidgetBase, _TemplatedMixin], {
        templateString: chatboxTemplateString,

        baseClass: "chatbox",

        /**
         *  @constructor
         *  @function
         *  @memberof ChatBox.prototype
         *  @param  {Object} args
         *  @param {number} [args.defaultTimeOut=60000] The amount of time
         *      in milliseconds normal messages will last before fading away.
         *  @param {number} args.messageMargin Margin, in pixels, between each
         *      message.
         */
        constructor: function (args) {
            args = args || {};
            this.defaultTimeOut = args.defaultTimeOut || 60 * 1000;
            this.messageMargin = args.messageMargin || 10;
        },

        /**
         *  Called when the widget is in the DOM, ready to be shown to the
         *  user.
         *  @memberOf ChatBox.prototype
         */
        startup: function () {
            this.inherited(arguments);
            this.resize();
        },

        /**
         *  Adds a message to the chat box.  The message will be read
         *  aloud once all previous messages have been read.
         *  @memberof ChatBox.prototype
         *  @param {string} messageText The message to send.
         *  @param {number} [timeOut=defaultTimeOut] The amount of time in
         *      milliseconds to wait before fading this message out.
         */
        addMessage: function (messageText, timeOut) {
            timeOut = timeOut || this.defaultTimeOut;
            var messageBox = domConstruct.create("div", {
                "innerHTML": messageText,
                "class": this.baseClass + "-message"
            }, this.containerNode);

            setTimeout(function () {
                var fadeOutAnimation = fx.fadeOut({
                        node: messageBox,
                        duration: 1000,
                        onEnd: function () {
                            domConstruct.destroy(messageBox);
                        }
                    });
                fadeOutAnimation.play();
            }, timeOut);
            this.resize();
        },

        /**
         *  Adjusts the position of child nodes.  This function should be
         *  called when the widget is resized.
         *  @memberOf ChatBox.prototype
         */
        resize: function () {
            var children = this.containerNode.children;
            var yPos = this.messageMargin;
            for(var i = children.length - 1; i >= 0; --i) {
                var messageHeight = domGeom.getMarginBox(children[i]).h;
                domStyle.set(children[i], "bottom", yPos + "px");
                yPos += messageHeight + this.messageMargin;
            }
        }
    });

    return ChatBox;
});
