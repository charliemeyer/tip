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
                "class": "chat-message"
            }, this.containerNode);

            var messageHeight = domGeom.getMarginBox(messageBox).h + this.messageMargin;
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
            this._shiftUp(messageHeight, messageBox);

            this._addToQueue(messageText);
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
        },

        /**
         *  Physically shifts the child nodes upwards by a particular amount.
         *  Used to make room for new messages in the queue.  amt is the
         *  amount, in pixels, to shift items up.  ignore is an optional node
         *  or list of nodes to --not-- shift.
         *  @private
         *  @memberof ChatBox.prototype
         *  @param {number} amt The amount, in pixels, by which messages should
         *      be shifted.  A positive number shifts up; negative shifts down.
         *  @param {domNode|domNode[]} [ignore=[]] One or more elements to NOT
         *      shift.
         */
        _shiftUp: function (amt, ignore) {
            if (!_.isArray(ignore)) {
                ignore = [ignore];
            }
            _.each(this.containerNode.children, function (child) {
                if (!_.includes(ignore, child)) {
                    var bottom = parseInt(domStyle.get(child, "bottom"));
                    domStyle.set(child, "bottom", bottom + amt + "px");
                }
            });
        }
    });

    return ChatBox;
});
