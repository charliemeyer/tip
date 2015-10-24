define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dojo/_base/fx",
        "dojo/query",
        "dojo/dom-construct"
    ], function (
        declare,
        _WidgetBase,
        fx,
        query,
        domConstruct
    ) {

    var ChatBox = declare([_WidgetBase], {
        constructor: function (args) {
            args = args || {};
            var id = args.id || "chat-area";
            if (id[0] !== "#") {
                id = "#" + id;
            }
            this.defaultTimeOut = args.defaultTimeOut || 60 * 1000;
            this.domNode = query(id)[0];
        },

        addMessage: function (messageText, timeOut) {
            timeOut = timeOut || this.defaultTimeOut;
            var messageBox = domConstruct.create("div", {
                innerHTML: messageText
            }, this.domNode);
            setTimeout(function () {
                fx.fadeOut({ node: messageBox, duration: 1000 }).play();
            }, timeOut);
        }
    });

    return ChatBox;
});