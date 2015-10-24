define([
        "dojo/_base/declare",
        "dojo/request",
        "js/lodash",
        "dojo/domReady!"
    ], function (
        declare,
        request,
        _
    ) {

    var Interviewer = declare(null, {
        constructor: function (args) {
            this.textBox = args.textBox;
            this.timer = args.timer;
            this.editor = args.editor;

            this.getQuestions();
        },

        beginInterview: function () {
            var self = this;
            var intro = "Hi! My name is Microsoft Sam. Let's get things started with a coding question. This is my question: ";
            var question = document.getElementById('question-prompt').innerHTML;
            this.addMessage(intro); // TODO ADD THIS BACK IN. (i removed it b/c annoying)
            this.addMessage(question);
            this.addMessage("Charlie is the prettiest person in the world");
            this.editor.runAndTest();

            this.timer.runTimer(function () {
                self.addMessage("Time is up!  We'll get back to you in a few days.");
            });
        },

        getQuestions: function () {
            request("/questions.json").then(function (response) {
                console.log(response);
            }, function (error) {
                console.log("ERROR");
                console.log(error);
            });
        },

        addMessage: function (message) {
            this.textBox.addMessage(message);
        }
    });

    return Interviewer;
});
