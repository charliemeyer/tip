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

    /**
     *  The Interviewer class manages and coordinates the other objects on the
     *  page.  It is the primary thing that interacts with the user.
     */
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

        /**
         *  Call to start the interview.  Begins the timer and says
         *  an introduction.
         */
        beginInterview: function () {
            var self = this;
            var intro = "Hi! My name is Microsoft Sam. Let's get things started with a coding question. This is my question: ";
            this.addMessage(intro); // TODO ADD THIS BACK IN. (i removed it b/c annoying)

            this.timer.runTimer(function () {
                self.addMessage("Time is up!  We'll get back to you in a few days.");
            });
        },

        /**
         *  Loads questions from the server, saving them in the class variable
         *  questions, which is an array.  If the request fails, a default
         *  set of arrays is made.  Either way, the first question in the
         *  list is then given to the user.
         */
        loadQuestions: function () {
            var self = this;
            this.nextQuestion = 0;
            request.post("http://simterview.appspot.com/questions.json").then(function (response) {
                self.questions = response;
                self.getNextQuestion();
            }, function (error) {
                self.questions = ["WHAT IS SORTING?"];
                self.getNextQuestion();
            });
        },

        /**
         *  Asks the user the next question in the list.  It is an error to
         *  call this function if there are no questions left.
         */
        getNextQuestion: function () {
            this.getNextQuestionOr(function () {
                console.log("ERROR IN Interviewer.getNextQuestion()");
            });
        },

        /**
         *  Gets the next question in the list, or calls the callback function
         *  if there are no questions left.
         */
        getNextQuestionOr: function (callback) {
            if (this.nextQuestion < this.questions.length) {
                var question = this.questions[this.nextQuestion++];
                this.addMessage(question);
                dom.byId("question-prompt").innerHTML = question;
            } else {
                callback.call(this);
            }
        },

        /**
         *  Gives a message (a string) to the user.
         */
        addMessage: function (message) {
            this.textBox.addMessage(message);
        },

        /**
         *  Evaluates the user's answer.  Gives feedback, and moves on to the
         *  next question if the answer was correct.
         */
        evaluateAnswer: function () {
            this.editor.runAndTest(function (data) {
                this.addMessage("YOUR ANSWER SUCKS");

                if (failedCases.length > 0) {
                    this.addMessage("I think you may have missed something.");
                } else {
                    this.getNextQuestionOr(function () {
                        this.addMessage("Good job!  You're all done!")
                    });
                }
            });
        }
    });

    return Interviewer;
});
