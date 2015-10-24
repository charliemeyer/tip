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

    var ChatBox = declare([_WidgetBase], {
        constructor: function (args) {
            args = args || {};
            var id = args.id || "chat-area";
            this.defaultTimeOut = args.defaultTimeOut || 60 * 1000;
            this.domNode = dom.byId(id);
            this.speakingQueue = [];
        },

        addMessage: function (messageText, timeOut) {
            timeOut = timeOut || this.defaultTimeOut;
            var messageBox = domConstruct.create("div", {
                "innerHTML": messageText,
                "class": "chat-message"
            }, this.domNode);
            var messageHeight = domGeom.getMarginBox(messageBox).h;
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
