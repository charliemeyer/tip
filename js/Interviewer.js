define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/request",
        "dojo/dom",
        "dojo/on",
        "js/lodash",
        "js/media",
        "dojo/domReady!"
    ], function (
        declare,
        lang,
        request,
        dom,
        on,
        _,
        media
    ) {

    function choose(array) {
        return array[Math.floor(Math.random() * array.length)];
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
            this.currentQuestion = null;
            this.canBotherUser = false;

            var self = this;
            var silentMoments = 0;
            this.waitForUser(5);
            setInterval(function() {
                if (media.checkVolume() && self.canBotherUser) {
                    if (silentMoments++ > 5) {
                        self.generateComment();
                        self.waitForUser(5);
                        silentMoments = 0;
                    }
                }
            }, 250);

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
            this.addMessage(intro);

            this.timer.runTimer(function (endedSoon) {
                if (!endedSoon) {
                    self.addMessage("Time is up!  We'll get back to you in a few days.");
                }
                self.endInterview();
            });
        },

        endInterview: function () {
            // Hide editor div, fill it with a results div
            this.timer.stopTimer();
            this.editor.hide();
            this.endscreen.show();
            this.canBotherUser = false;
            clearTimeout(this.waitingID);
            document.getElementById('bottombar').style.display = 'none';
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
                setTimeout(function () {
                    self.getNextQuestion();
                }, 3000);
            }, function (error) {
                self.questions = [{
                    function_name: "sort(list, length)",
                    question: "Sort a list",
                    desc: "Sort a list of numbers.",
                    testcases: [["[3, 2, 1]", "[1, 2, 3]"]]
                }];
                setTimeout(function () {
                    self.getNextQuestion();
                }, 3000);
            });
        },

        waitForUser: function (seconds) {
            this.canBotherUser = false;
            this.waitingID = setTimeout(function () {
                this.canBotherUser = true;
            }, seconds * 1000);
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
                this.currentQuestion = this.questions[this.nextQuestion++];
                var message = this.currentQuestion.desc;
                this.addMessage(message);
                dom.byId("question-prompt").innerHTML = "Define " + this.currentQuestion.function_name + "() " + this.currentQuestion.question;
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
            var row = this.editor.getCursorPosition().row - 1;
            var lines = this.editor.getValue().split("\n");
            var comment = false;
            while (row >= 0 && !comment) {
                comment = this.getCommentFrom(lines[row], row + 1);
                --row;
            }
            if (comment) {
                this.addMessage(comment);
            }
        },

        getCommentFrom: function (line, number) {
            if (_.contains(this.explainedLines, number)) return;
            var variables = /(\w*)\s*=/.exec(line);
            if (_.contains(line, "if")) {
                this.explainedLines.push(number);
                return choose(["What is that if statement on line " + number + " testing for?",
                    "Can you explain the check you make on line " + number + "?"]);
            } else if (_.contains(line, "while") || _.contains(line, "for")) {
                this.explainedLines.push(number);
                return choose(["Can you explain the invariant for the loop on line " + number + "?",
                    "What will be the time complexity of the loop on line " + number + "?"]);
            } else if (variables.length > 1) {
                return choose(["What are you using " + variables[1] + " for?",
                    "What does " + variables[1] + " hold?",
                    "What value will " + variables[1] + " have after line " + number + "?"]);
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
                return str;//str.replace(/ /g,'');
            }
            var self = this;
            this.editor.runAndTest(this.currentQuestion, function (data) {
                data = data.result;
                var failedCases = [];
                var numSuccesses = 0;
                _.each(data.stdout, function (output, testnum) {
                    if (removeWhiteSpace(output) == removeWhiteSpace(self.currentQuestion.testcases[testnum][1])) {
                        ++numSuccesses;
                    } else {
                        failedCases.push(testnum);
                    }
                });

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
                    setTimeout(function () {
                        self.getNextQuestionOr(function () {
                            self.endInterview();
                        });
                    }, 3000)
                }
            });
        }
    });
    return Interviewer;
});
