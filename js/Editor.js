define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!js/templates/editor.html",
        "dojo/dom-style",
        "dojo/on",
        "js/media",
        "util/lodash"
    ], function (
        declare,
        lang,
        _WidgetBase,
        _TemplatedMixin,
        editorTemplateString,
        domStyle,
        on,
        media,
        _
    ) {

    /**
     *  An Editor is a text area allowing the user to type and test code.
     *  It uses the ace plugin under the hood, and records users' keystrokes
     *  so it can be played back.
     *  @class
     *  @name  Editor
     *  @extends ace.Editor
     *  @requires ace
     */
    var Editor = declare([_WidgetBase, _TemplatedMixin], {
        templateString: editorTemplateString,

        /**
         *  @constructor
         *  @function
         *  @memberof Editor.prototype
         */
        constructor: function (args) {
            /**
             *  The time that the editor was created.  Used as a benchmark
             *  to know when, relatively, changes were made.
             *  @name initTime
             *  @memberof Editor.prototype
             *  @type {number}
             */
            this.initTime = (new Date()).getTime();

            /**
             *  A list of changes made in the editor.  A change is a pair of
             *  the form [timeSinceStart, valueOfEditorAtThatTime]
             *  @name  changelog
             *  @type {number[][]}
             *  @memberof Editor.prototype
             *  @todo Use an object instead of a tuple.
             */
            this.changelog = [[0, ""]];

            this.evaluateAnswer = function () {
                console.log("ERROR: No evaluateAnswer callback connected!");
            }
            // this.$blockScrolling = Infinity;
        },

        postCreate: function () {
            this.inherited(arguments)
            var self = this;
            this.editor =  ace.edit(this.editor);
            this.editor.setTheme("ace/theme/textmate");
            this.editor.session.setMode("ace/mode/javascript");
            this.editor.on('change', function(e) {
                var timediff = ((new Date()).getTime() - self.initTime);
                var code_value = self.editor.getValue();
                self.changelog.push([timediff, code_value]);
            });
        },

        startup: function () {
            var self = this;
            // Charlie's sick jquery code fuck this dojo bozo
            $("#syntaxhelp").change(function(){
                self.editor.getSession().setUseWorker($(this).prop("checked"));
            });

            $("#langoptions").change(function(){
                var language = $(this).val();
                self.editor.session.setMode("ace/mode/" + language);
            });

            $("#user-input-button").click(function () {
                self.runAndTest(self.getQuestion());
            });

            return this.inherited(arguments);
        },

        /**
         *  Plays back in real time the user's keystrokes, so they can see
         *  the changes they made.
         *  @memberof Editor.prototype
         *  @todo  Apparently you can call editor.setReadOnly(true).  We should
         *      try that instead of whatever we're doing now.
         */
        playback: function() {
            domStyle.set(this.editor.container, "display", "none");
            var resultsArea = this.resultsArea;
            this.changelog.forEach(function (e) {
                var timediff = e[0];
                var code = e[1];
                setTimeout(function() {
                    resultsArea.innerHTML = code;
                }, timediff);
            });
           media.play_wav();
        },

        /**
         *  Remotely runs the code that the user has typed in the editor.
         *  Calls evaluateAnswer(), which should be linked to the interviewer.
         *  @memberof Editor.prototype
         *  @param {Object} question The question details to test the code
         *      against.
         *  @param {string} question.function_name The name of the function the
         *      user was supposed to write.
         *  @param {string} question.testcases The tests to run, of which the
         *      first element of each array is the input to supply.
         */
        runAndTest: function (question) {
            // TODO: These things should be static properties of the class?
            var base_url = "/test";
            var api_key = "hackerrank|538314-385|8ca6ef0fcb4573c92eedb20c04fec92a0b5c8be6";
            var lang_map = {"c":1,"c++":2,"java":3,"python":5,"perl":6,"php":7,"Ruby":8,"csharp":9,"mysql":10,"oracle":11,"haskell":12,"clojure":13,"bash":14,"scala":15,"erlang":16,"lua":18,"javascript":20,"go":21,"d":22,"ocaml":23,"r":24,"pascal":25,"sbcl":26,"python3":30,"groovy":31,"objectivec":32,"fsharp":33,"cobol":36,"visualbasic":37,"lolcode":38,"smalltalk":39,"tcl":40,"whitespace":41,"tsql":42,"java8":43,"db2":44,"octave":46,"xquery":48,"racket":49,"rust":50,"swift":51,"fortran":54};
            var boilerplates = {
                "python": "print " + question.function_name + "(input())"
            };
            var language = $("#langoptions").val();
            var lang = lang_map[language];
            var source = this.editor.getValue() + "\n" + boilerplates[language];
            var params = {
                source: source,
                lang: lang,
                api_key: api_key,
                testcases: JSON.stringify(_.map(question.testcases, function (elem) {
                    return elem[0]+"";
                }))
            };
            var self = this;
            $.post(base_url, params, function(data){
                self.evaluateAnswer(data);
            }).fail(/*alert("failed to check code")*/);
        },

        /**
         *  Hides the editor from the user.
         *  @memberof Editor.prototype
         */
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
        },

        /**
         *  Displays or un-hides the editor for the user.
         *  @memberof Editor.prototype
         */
        show: function () {
            domStyle.set(this.domNode, "display", "block");
        }
    });

    return Editor;
});

