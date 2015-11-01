define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!js/templates/chatbox.html",
        "dojo/_base/fx",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/on",

        "util/lodash"
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
     *  bottom.  Messages fade out after some time.  Messages are read
     *  aloud when they are added to the chat.
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
            /**
             *  A queue of messages to be given to the user.  Only one can be
             *  sent at a time.
             *  @name  speakingQueue
             *  @type {string[]}
             *  @memberOf ChatBox.prototype
             *  @todo This should probably be part of the interviewer.
             */
            this.speakingQueue = [];
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
            this._addToQueue(messageText);
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
        },

        /**
         *  Adds a given message to the queue of things to be read aloud.
         *  If there is nothing else in the queue, it will be read; otherwise
         *  it will be read only after the messages before it in the queue
         *  are read.
         *  @private
         *  @memberof ChatBox.prototype
         *  @param {string} message The text to add to the queue.  Such text
         *      should be "plaintext," ie. without HTML formatting.
         *  @todo The reading part should probably be a separate component.
         *      Then maybe it would add a message to the chatbox, only when
         *      preceding messages have been read.
         */
        _addToQueue: function (message) {
            var self = this;
            this.speakingQueue.push(message);
            if (this.speakingQueue.length === 1) {
                meSpeak.speak(message, {}, function removeFromQueue() {
                    self.speakingQueue.shift();
                    if (self.speakingQueue.length > 0) {
                        message = self.speakingQueue[0];
                        meSpeak.speak(message, {}, removeFromQueue);
                    }
                });
            }
        }
    });

    return ChatBox;
});
