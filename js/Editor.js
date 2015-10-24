define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/on",
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

            this.changelog = [[0, this.getValue()]];
            var self = this;
            this.on('change', function(e) {
                var timediff = ((new Date()).getTime() - initTime);
                var code_value = self.getValue();
                self.changelog.push([timediff, code_value]);
            });
            this.$blockScrolling = Infinity;
        },

        playback: function() {
            $('#editor').hide();
            $('#results').show();
            var div = document.getElementById('editor');
            this.changelog.forEach(function (e) {
                var timediff = e[0];
                var code = e[1];
                setTimeout(function() {
                    $('#results').html(code);
                }, timediff);
            });

        },

        runAndTest: function () {
            var code = this.getValue();
        }
    });

    return Editor;
});
