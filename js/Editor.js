define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "js/lodash"
    ], function (
        declare,
        lang,
        _
    ) {

    var Editor = declare(null, {
        constructor: function (args) {
            var editorId = args.editor || "editor";
            lang.mixin(this, ace.edit("editor"));
            this.setTheme("ace/theme/clouds");
            this.session.setMode("ace/mode/javascript");
        },

        runAndTest: function () {
            var code = this.getValue()
        }
    });

    return Editor;
});