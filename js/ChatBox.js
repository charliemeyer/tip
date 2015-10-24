define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dojo/query"
    ], function (
        declare,
        _WidgetBase,
        query
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

        addMessage: function (message, timeOut) {
            timeOut = timeOut || this.defaultTimeOut;
        },

        test: function () {
            console.log("WORKS");
        }
    });

    return ChatBox;
});