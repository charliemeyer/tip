define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!js/templates/timer.html",
        "dojo/_base/fx",
        "dojo/dom-style",
        "dojo/dom",
        "dojo/dom-construct"
    ], function (
        declare,
        _WidgetBase,
        _TemplatedMixin,
        timerTemplateString,
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
