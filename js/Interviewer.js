define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/request",
        "dojo/dom",
        "dojo/on",
        "js/lodash",
        "dojo/domReady!"
    ], function (
        declare,
        lang,
        request,
        dom,
        on,
        _
    ) {

    var Interviewer = declare(null, {
        constructor: function (args) {
            this.textBox = args.textBox;
            this.timer = args.timer;
            this.editor = args.editor;
            this.questions = [];
            this.nextQuestion = 0;

            on(dom.byId("user-input-button"), "click", lang.hitch(this, this.evaluateAnswer));

            this.loadQuestions();
        },

        beginInterview: function () {
            var self = this;
            var intro = "Hi! My name is Microsoft Sam. Let's get things started with a coding question. This is my question: ";
            var question = document.getElementById('question-prompt').innerHTML;
            this.addMessage(intro); // TODO ADD THIS BACK IN. (i removed it b/c annoying)
            this.editor.runAndTest();

            this.timer.runTimer(function () {
                self.addMessage("Time is up!  We'll get back to you in a few days.");
            });
        },

        loadQuestions: function () {
            var self = this;
            this.nextQuestion = 0;
            request("http://simterview.appspot.com/questions.json").then(function (response) {
                self.questions = response;
                self.getNextQuestion();
            }, function (error) {
                self.questions = ["WHAT IS SORTING?"];
                self.getNextQuestion();
            });
        },

        getNextQuestion: function () {
            this.getNextQuestionOr(function () {
                console.log("ERROR IN Interviewer.getNextQuestion()");
            });
        },

        getNextQuestionOr: function (callback) {
            if (this.nextQuestion < this.questions.length) {
                var question = this.questions[this.nextQuestion++];
                this.addMessage(question);
                dom.byId("question-prompt").innerHTML = question;
            } else {
                callback.call(this);
            }
        },

        addMessage: function (message) {
            this.textBox.addMessage(message);
        },

        evaluateAnswer: function () {
            var failedCases = this.editor.runAndTest();
            this.addMessage("YOUR ANSWER SUCKS");

            if (failedCases.length > 0) {
                this.addMessage("I think you may have missed something.");
            } else {
                this.getNextQuestionOr(function () {
                    this.addMessage("Good job!  You're all done!")
                });
            }
        }
    });

    return Interviewer;
});
