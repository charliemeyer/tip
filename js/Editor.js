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
            var initTime = (new Date()).getTime();

            var changelog = [];
            var self = this;
            this.on('change', function(e) {
                var timediff = ((new Date()).getTime() - initTime);
                var code_value = self.getValue();
                changelog.push([timediff, code_value]);
            });
        },

        runAndTest: function () {
            var code = this.getValue()
        }
    });

    return Editor;
});
