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

    function choose(array) {
        return array[Math.floor(Math.random() * myArray.length)];
    }

    /**
     *  The Interviewer class manages and coordinates the other objects on the
     *  page.  It is the primary thing that interacts with the user.
     */
    var Interviewer = declare(null, {
        constructor: function (args) {
            this.textBox = args.textBox;
            this.timer = args.timer;
            this.editor = args.editor;
            this.endscreen = args.endscreen;
            this.endscreen.registerEditor(this.editor);
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
            var intro = "Hi! My name is Microsoft Sam. Let's get things started with a coding question.";
            this.addMessage(intro); // TODO ADD THIS BACK IN. (i removed it b/c annoying)

            this.timer.runTimer(function () {
                self.addMessage("Time is up!  We'll get back to you in a few days.");
                self.endInterview();
            });
        },

        endInterview: function () {
            this.editor.hide();
            this.endscreen.show();
            //this.editor.playback();
            // Hide editor div, fill it with a results div
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
            request.get("/questions.json").then(function (response) {
                self.questions = JSON.parse(response);
                self.getNextQuestion();
            }, function (error) {
                self.questions = [{
                    function_name: "sort(list, length)",
                    question: "Sort a list",
                    desc: "Sort a list of numbers.",
                    testcases: [["[3, 2, 1]", "[1, 2, 3]"]]
                }];
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
                var message = "Please write a function called " + question.function_name + " that should do the following:";
                this.addMessage(message);
                this.addMessage(question.desc);
                dom.byId("question-prompt").innerHTML = question.question;
            } else {
                callback.call(this);
            }
            this.explainedLines = [];
        },

        /**
         *  Gives a message (a string) to the user.
         */
        addMessage: function (message) {
            this.textBox.addMessage(message);
        },

        /**
         *  Searches code near where the user is typing to see if there's
         *  something that can be commented on.
         */
        generateComment: function () {
            var row = this.editor.getCursorPosition().row;
            var lines = this.editor.getValue().split("\n");
            console.log(row);
            var comment = false;
            while (row > 0 && !comment) {
                comment = this.getCommentFrom(lines[row], row + 1);
                row--;
            }
            if (comment) {
                this.addMessage(comment);
            }
        },

        getCommentFrom: function (line, number) {
            if (_.contains(this.explainedLines, number)) return;
            if (_.contains(line, "if")) {
                this.explainedLines.push(number);
                return choose(["What is that if statement on line " + number + " testing for?",
                    "Can you explain the check you make on line " + number + "?"]);
            } else if (_.contains(line, "while") || _.contains(line, "for")) {
                this.explainedLines.push(number);
                return choose(["Can you explain the invariant for the loop on line " + number + "?",
                    "What will be the time complexity of the loop on line " + number + "?"]);
            } else {
                return false;
            }
        },

        /**
         *  Evaluates the user's answer.  Gives feedback, and moves on to the
         *  next question if the answer was correct.
         */
        evaluateAnswer: function () {
            function removeWhiteSpace(str) {
                return str.replace(/ /g,'');
            }
            var self = this;
                self.generateComment();
            this.editor.runAndTest(function (data) {
                data = data.result;
                var failedCases = [];
                var numSuccesses = 0;
                _.each(data.stdout, function (output, testnum) {
                    if (removeWhiteSpace(output) === removeWhiteSpace(self.questions[testnum][1])) {
                        ++numSuccesses;
                    } else {
                        failedCases.push(testnum);
                    }
                });
                // TODO: assign failedCases
                console.log(data);
                // check test cases

                if (failedCases.length > 0) {
                    if (numSuccesses === 0) {
                        self.addMessage(choose(["Okay.  Why don't you try walking through an example?",
                            "Hm, I'm not sure this does quite what you're thinking.  Try stepping through it.",
                            "I don't think this is quite going to work."]));
                    } else if (numSuccesses < failedCases.length) {
                        self.addMessage(choose(["Are you sure this works correctly in all cases?",
                            "How about making a test case and walking through it for me?"]));
                    } else {
                        self.addMessage("I think you may have missed something.  Try walking through the code on this example: " + choose(failedCases));
                    }
                } else {
                    self.addMessage(choose(["Okay, that looks fine to me.",
                        "Sure, that should work.",
                        "I think this'll work."]));
                    self.getNextQuestionOr(function () {
                        self.endInterview();
                    });
                }
            });
        }
    });
    return Interviewer;
});
