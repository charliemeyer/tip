define([
        "dojo/_base/declare",
        "dojo/io-query",
        "dojo/_base/fx",
        "dojo/dom-style",
        "dojo/dom",
        "dojo/dom-construct"
    ], function (
        declare,
        ioQuery,
        fx,
        domStyle,
        dom,
        domConstruct
    ) {


    /**
     *  @class
     *  @name  InterfaceManager
     *  @extends dijit._WidgetBase
     */
    var InterfaceManager = declare(null, {

        /**
         *
         *  @memberof InterfaceManager.prototype
         */
        build: function () {
            var queryString = document.location.search.substr(
                                    document.location.search[0] === "?" ? 1 : 0);
            var urlParams = ioQuery.queryToObject(queryString);
            this._timer.setTime({minutes: urlParams["duration"]});
            this._timer.renderTime();

            this._editor.placeAt(dom.byId("main-area"));
            this._prompt.placeAt(dom.byId("question-prompt"));
            this._chatBox.placeAt(dom.byId("chat-area"));
            this._timer.placeAt(dom.byId("time-area"));

        },

        onInterviewStart: function () {
            setTimeout(function () {
                fx.fadeOut({
                    node: dom.byId("loadingOverlay"),
                    duration: 1000,
                    onEnd: function(node){
                        domStyle.set(node, 'display', 'none');
                    }
                }).play();
            }, 100);
        }
    });

    return InterfaceManager;
});
