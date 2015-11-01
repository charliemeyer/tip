define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/request",
        "dojo/dom",
        "dojo/on",
        "util/lodash",
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

    /**
     *  The Interviewer class manages and coordinates the other objects on the
     *  page.  It is the primary thing that interacts with the user.
     *  @class
     *  @name  Interviewer
     */
    var Interviewer = declare(null, {
        /**
         *  @constructor
         *  @function
         *  @memberof Interviewer.prototype
         *  @param  {Object} args
         *  @param {TextBox} args.textBox The text box for the interviewer
         *      to use for communication with the user.
         *  @param {Timer} args.timer The timer for the interviewer to use.
         *  @param {Editor} args.editor The editor for the interviewer to
         *      look at.
         *  @param {Endscreen} args.endscreen The screen to transition to when
         *      the interview is over.
         *  @todo  Instead of having these stored in the interviewer, keep them
         *      as separate components that can interact.
         */
        constructor: function (args) {
            this.textBox = args.textBox;
            this.timer = args.timer;
            this.editor = args.editor;
            this.endscreen = args.endscreen;
            this.endscreen.editor = this.editor;
            /**
             *  A list of questions for the interviewer to ask.
             *  @name  questions
             *  @type {Object[]}
             *  @memberof Interviewer.prototype
             */
            this.questions = [];
            /**
             *  The number of the next question to ask the user.
             *  @name  nextQuestion
             *  @type {number}
             *  @memberof Interviewer.prototype
             */
            this.nextQuestion = 0;
            /**
             *  The current question being asked of the user.
             *  @name  currentQuestion
             *  @type {Object|null}
             *  @memberof Interviewer.prototype
             */
            this.currentQuestion = null;
            /**
             *  Whether the interviewer should attempt to make smalltalk.
             *  @name  canBotherUser
             *  @type {boolean}
             *  @memberof Interviewer.prototype
             */
            this.canBotherUser = false;

            var self = this;
            var silentMoments = 0;
            this.waitForUser(5);
            setInterval(function() {
                if (media.checkVolume() && self.canBotherUser) {
                    console.log("silent");
                    if (silentMoments++ > 5) {
                        self.generateComment();
                        self.waitForUser(5);
                        silentMoments = 0;
                    }
                }
            }, 250);

            this.loadQuestions();
        },

        // For now.
        startup: function () {
            var self = this;
            $("#langoptions").change(function(){
                var language = $(this).val();
                setTimeout(function () {
                    self.addMessage(self.makeMessage([
                        "What's your favorite part about " + language + "?",
                        "Why do you want to use " + language + " for this?"
                    ]));
                }, 500);
            });
        },

        getQuestion: function () {
            return this.currentQuestion;
        },

        /**
         *  Call to start the interview.  Begins the timer and says
         *  an introduction.
         *  @memberof Interviewer.prototype
         */
        beginInterview: function () {
            var self = this;
            var intro = this.makeMessage(
                ["Hi", "Hello"], ", my name is ",
                ["Bill", "Stephen"], " ",
                ["Gates", "Hawking"], ".  ",
                ["It's nice ", "It's a pleasure", "I'm glad", "I'm happy"],
                " to meet you."
            );
            this.addMessage(intro);

            this.addMessage(this.makeMessage(
                "Let's get started with some coding questions."
            ));

            this.timer.runTimer(function (endedSoon) {
                if (!endedSoon) {
                    self.addMessage("Time is up!  We'll get back to you in a few days.");
                    self.endInterview();
                }
            });
            this.startup();
        },

        /**
         *  Ends the interview, transitioning the interface to the endscreen,
         *  and bidding the user farewell.
         *  @memberof Interviewer.prototype
         *  @todo Make this a message that interested components can
         *      respond to.
         */
        endInterview: function () {
            // Hide editor div, fill it with a results div
            this.timer.stopTimer();
            this.editor.hide();
            this.endscreen.placeAt(dom.byId("main-area")).show();
            this.addMessage(this.makeMessage(
                "That's it for the coding part of the interview.  ",
                [
                    "It's been a pleasure speaking with you.  ",
                    "I'm glad we got the chance to talk.  ",
                    "Thanks for your time.  ",
                    "Thank you for your time.  ",
                    ""
                ], [
                    "We should get back to you in a few days.  ",
                    ""
                ], [
                    "I wish you the best of luck",
                    "Good luck"
                ], ["!", "."]
            ));
            this.canBotherUser = false;
            clearTimeout(this.waitingID);
            document.getElementById('bottombar').style.display = 'none';
            document.getElementById('question-prompt').innerHTML = 'Done with interview!';
        },

        /**
         *  Loads questions from the server, saving them in the class variable
         *  questions, which is an array.  If the request fails, a default
         *  set of arrays is made.  Either way, the first question in the
         *  list is then given to the user.
         *  @memberof Interviewer.prototype
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
                    function_name: "sort",
                    question: "Sort a list",
                    desc: "Sort a list of numbers.",
                    testcases: [["[3, 2, 1]", "[1, 2, 3]"]]
                }];
                setTimeout(function () {
                    self.getNextQuestion();
                }, 3000);
            });
        },

        /**
         *  Prevents the interviewer from displaying a message to the user for
         *  a certain amount of time.
         *  @memberof Interviewer.prototype
         *  @param  {number} seconds Number of seconds to wait before the
         *      interviewer can send further messages to the user.
         */
        waitForUser: function (seconds) {
            this.canBotherUser = false;
            this.waitingID = setTimeout(function () {
                this.canBotherUser = true;
            }, seconds * 1000);
        },

        /**
         *  Asks the user the next question in the list.  It is an error to
         *  call this function if there are no questions left.
         *  @memberof Interviewer.prototype
         */
        getNextQuestion: function () {
            this.getNextQuestionOr(function () {
                console.log("ERROR IN Interviewer.getNextQuestion()");
            });
        },

        /**
         *  Gets the next question in the list, or calls the callback function
         *  if there are no questions left.
         *  @memberof Interviewer.prototype
         *  @param {function} callback Called with no parameters if the
         *      question list has been exhausted.  No return value expected.
         */
        getNextQuestionOr: function (callback) {
            if (this.nextQuestion < this.questions.length) {
                this.editor.editor.setValue('');
                this.currentQuestion = this.questions[this.nextQuestion++];
                var message = this.currentQuestion.desc;
                this.addMessage(this.currentQuestion.desc);
                dom.byId("question-prompt").innerHTML = "Define the function " + this.currentQuestion.function_name + " - " + this.currentQuestion.question;
            } else {
                callback.call(this);
            }
            this.explainedLines = [];
        },

        /**
         *  Presents the message to the user.
         *  @memberof Interviewer.prototype
         *  @param {string} message The message to present.
         */
        addMessage: function (message) {
            this.textBox.addMessage(message);
        },

        /**
         *  Creates a random message, choosing one element from each of the
         *  parts passed in.  One string is chosen from each parameter, and
         *  they are concatenated together, in order.
         *  @memberOf Interviewer.prototype
         *  @example
         *  this.makeMessage(["Hi", "Hello", "Sup"], ", my name is ",
         *      ["Bill Gates", "Stephen Hawking", "Bill Hawking"]);
         *  // Possible results are:
         *  //   "Hi, my name is Bill Gates"
         *  //   "Sup, my name is Stephen Hawking"
         *  //   "Hello, my name is Bill Hawking"
         *  // etc.
         *  @param  {...string|string[]} messages A list of messages to choose
         *      between.  Parameters are variadic, ie. you can just list each
         *      part of the message as a separate parameter.
         *  @return {string} The message created.
         *  @todo  This could recursively resolve things in a Markov-chain sort
         *      of way, ie. allow arrays within arrays for choices within
         *      choices.
         */
        makeMessage: function () {
            var message = "";
            _.each(arguments, function (messages) {
                if (!_.isArray(messages)) {
                    message += messages;
                } else {
                    message += _.sample(messages);
                }
            });
            return message;
        },

        /**
         *  Searches code near where the user is typing to see if there's
         *  something that can be commented on.  If so, a comment is made.
         *  @memberof Interviewer.prototype
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

        /**
         *  Generates a comment based on the given line, identified by the
         *  given number.
         *  @memberof Interviewer.prototype
         *  @param  {string} line The line to inspect.
         *  @param  {number} number The number to identify the line by.
         *  @return {string|false} Returns false if no comment can be made.
         *      Otherwise, the comment is returned.
         */
        getCommentFrom: function (line, number) {
            if (_.contains(this.explainedLines, number)) return;
            var variables = /(\w*)\s*=/.exec(line);
            if (_.contains(line, "if")) {
                this.explainedLines.push(number);
                return this.makeMessage([
                    "What is that if statement on line " + number + " testing for?",
                    "Can you explain the check you make on line " + number + "?"
                ]);
            } else if (_.contains(line, "while") || _.contains(line, "for")) {
                this.explainedLines.push(number);
                return this.makeMessage([
                    "Can you explain the invariant for the loop on line " + number + "?",
                    "What will be the time complexity of the loop on line " + number + "?"
                ]);
            } else if (variables.length > 1) {
                return this.makeMessage([
                        "What are you using " + variables[1] + " for?",
                        "What does " + variables[1] + " hold?",
                        "What value will " + variables[1] + " have after line " + number + "?"
                ]);
            } else {
                return false;
            }
        },

        /**
         *  Evaluates the user's code.  Gives feedback, and moves on to the
         *  next question if the answer was correct.
         *  @memberof Interviewer.prototype
         */
        evaluateAnswer: function (data) {
            function removeWhiteSpace(str) {
                return str;//str.replace(/ /g,'');
            }
            var self = this;
            data = data.result;
            var failedCases = _.filter(this.currentQuestion.testcases, function (test, testnum) {
                return (removeWhiteSpace(data.stdout[testnum]) !== removeWhiteSpace(test[1]));
            }, this);
            var numFailures = failedCases.length;
            var numSuccesses = data.stdout.length - numFailures;

            if (numFailures > 0) {
                if (numSuccesses === 0) {
                    this.addMessage(this.makeMessage(
                        ["Okay.  ", ""],
                        [
                          "I'm not sure this does quite what you're thinking.",
                          "I don't think this is quite going to work.",
                          "Do you see anything wrong with the code?"
                        ], "  ",
                        [
                          "Try stepping through it.",
                          "Why don't you try walking through an example?",
                          "Try an example input."
                        ]
                    ));
                } else if (numSuccesses < numFailures) {
                    this.addMessage(this.makeMessage([
                        "Are you sure this works correctly in all cases?",
                        "How about making a test case and walking through it?"
                    ]));
                } else {
                    this.addMessage("I think you may have missed something.  Try walking through the code on this example: " + _.sample(failedCases));
                }
            } else {
                this.addMessage(this.makeMessage(
                    ["Okay.  ", "Sure.  ", "Good.  ", ""],
                    [
                      "That looks fine to me.",
                      "That should work.",
                      "I think this'll work."
                    ]
                ));
                setTimeout(function () {
                    self.getNextQuestionOr(function () {
                        self.endInterview();
                    });
                }, 3000)
            }
        }
    });
    return Interviewer;
});
