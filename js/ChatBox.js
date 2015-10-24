define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dojo/_base/fx",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/on",

        "js/lodash"
    ], function (
        declare,
        _WidgetBase,
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
     */
    var ChatBox = declare([_WidgetBase], {
        constructor: function (args) {
            args = args || {};
            var id = args.id || "chat-area";
            this.defaultTimeOut = args.defaultTimeOut || 60 * 1000;
            this.domNode = dom.byId(id);
            this.speakingQueue = [];
        },

        /**
         *  Adds a message to the chat box.  The second parameter is optional;
         *  if omitted, a default timeout is used.  The message will be read
         *  aloud once all previous messages have been read.
         */
        addMessage: function (messageText, timeOut) {
            timeOut = timeOut || this.defaultTimeOut;
            var messageBox = domConstruct.create("div", {
                "innerHTML": messageText,
                "class": "chat-message"
            }, this.domNode);
            var messageHeight = domGeom.getMarginBox(messageBox).h + 10;
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
         */
        _shiftUp: function (amt, ignore) {
            if (!_.isArray(ignore)) {
                ignore = [ignore];
            }
            _.each(this.domNode.children, function (child) {
                if (!_.includes(ignore, child)) {
                    var bottom = parseInt(domStyle.get(child, "bottom"));
                    domStyle.set(child, "bottom", bottom + amt + "px");
                }
            });
        }
    });

    return ChatBox;
});
