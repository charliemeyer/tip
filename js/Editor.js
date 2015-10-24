define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-style",
        "dojo/on",
        "js/media",
        "js/lodash"
    ], function (
        declare,
        lang,
        domStyle,
        on,
        media,
        _
    ) {

    /**
     *  An Editor is a text area allowing the user to type and test code.
     *  It uses the ace plugin under the hood, and records users' keystrokes
     *  so it can be played back.
     */
    var Editor = declare(null, {
        constructor: function (args) {
            var editorId = args.editor || "editor";
            lang.mixin(this, ace.edit("editor"));
            this.setTheme("ace/theme/textmate");
            this.session.setMode("ace/mode/javascript");
            this.initTime = (new Date()).getTime();

            this.changelog = [[0, this.getValue()]];
            var self = this;
            this.on('change', function(e) {
                var timediff = ((new Date()).getTime() - self.initTime);
                var code_value = self.getValue();
                self.changelog.push([timediff, code_value]);
            });
            this.$blockScrolling = Infinity;
        },

        /**
         *  Plays back in real time the user's keystrokes, so they can see
         *  the changes they made.
         */
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
           media.play_wav();
        },

        /**
         *  Remotely runs the code that the user has typed in the editor.
         *  Calls the callback function with the results of the test.
         */
        runAndTest: function (callback) {
            base_url = "/test";
            api_key = "hackerrank|538314-385|8ca6ef0fcb4573c92eedb20c04fec92a0b5c8be6";
            lang_map = {"C":1,"C++":2,"Java":3,"Python":5,"perl":6,"php":7,"Ruby":8,"csharp":9,"mysql":10,"oracle":11,"haskell":12,"clojure":13,"bash":14,"scala":15,"erlang":16,"lua":18,"Javascript":20,"go":21,"d":22,"ocaml":23,"r":24,"pascal":25,"sbcl":26,"python3":30,"groovy":31,"objectivec":32,"fsharp":33,"cobol":36,"visualbasic":37,"lolcode":38,"smalltalk":39,"tcl":40,"whitespace":41,"tsql":42,"Java8":43,"db2":44,"octave":46,"xquery":48,"racket":49,"rust":50,"swift":51,"fortran":54};
            lang = lang_map[$("#langoptions").val()];
            source = this.getValue();
            testcases = '["1","2","3","4"]';
            params = {
                source: source,
                lang: lang,
                api_key: api_key,
                testcases: testcases
            };
            $.post(base_url, params, function(data){
                callback(data);
            }).fail(/*alert("failed to check code")*/);
        },

        hide: function () {
            domStyle.set(this.container, "display", "none");
        },

        show: function () {
            domStyle.set(this.container, "display", "block");
        }
    });

    return Editor;
});

