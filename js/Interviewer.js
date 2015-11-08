define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/request",
        "dojo/dom",
        "dojo/on",
        "util/lodash",
        "js/EventQueue",
        "js/media",
        "js/Phrase",
        "dojo/text!js/interviewer-phrases.json",
        "dojo/domReady!"
    ], function (
        declare,
        lang,
        request,
        dom,
        on,
        _,
        EventQueue,
        media,
        Phrase,
        phraseList
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
         *  @todo  Instead of having these stored in the interviewer, keep them
         *      as separate components that can interact.
         */
        constructor: function (args) {
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
             *  @type {?Object}
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
            /**
             *  A queue of messages to be given to the user.  Only one can be
             *  sent at a time.
             *  @name  speakingQueue
             *  @type {EventQueue}
             *  @memberOf Interviewer.prototype
             */
            this.speakingQueue = new EventQueue();

            /**
             *  An object containing phrases the interviewer may say.
             *  @name  phrases
             *  @type {Object.<string, Phrase>}
             *  @memberof Interviewer.prototype
             */
            this.phrases = _.mapValues(JSON.parse(phraseList), function (p) {
                return new Phrase(p);
            });

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

        events: function () {
            return [
                ["signalStart", "interviewStart"]
            ];
        },

        // For now.
        onLanguageChange: function (language) {
            var self = this;
            setTimeout(function () {
                self.addMessage(self.phrases["changeLanguage"].withContext({
                    "language": language
               }));
            }, 500);
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
            this.signalStart();

            setTimeout(function () {
                self.addMessage(self.phrases["introduction"]);
                self.addMessage(self.phrases["beginCoding"]);
                self._timer.runTimer();
            }, 1000);

            this._timer.on("end", function () {
                self.addMessage(self.phrases["timeUp"]);
                self.endInterview();
            });
            this._timer.on("pause", function () {
                self.endInterview();
            });
        },

        /**
         *  Ends the interview, transitioning the interface to the endscreen,
         *  and bidding the user farewell.
         *  @memberof Interviewer.prototype
         *  @todo Make this a message that interested components can
         *      respond to.
         */
        endInterview: function () {
            // Hide _editor div, fill it with a results div
            this._editor.hide();
            this._endscreen.placeAt(dom.byId("main-area")).show();
            this.canBotherUser = false;
            clearTimeout(this.waitingID);
            this._questionPrompt.set("content", "Done with interview!");
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
                    self.getNextQuestion(); // DO ON AN EVENT INSTEAD
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
                console.error("NO MORE QUESTIONS LEFT TO GET.");
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
                this._editor.editor.setValue('');
                this.currentQuestion = this.questions[this.nextQuestion++];
                var message = this.currentQuestion.desc;
                this.addMessage(this.currentQuestion.desc, {
                    whenWritten: function () {
                        this._questionPrompt.set("content", "Define the function " + this.currentQuestion.function_name + " - " + this.currentQuestion.question);
                    },
                    thisArg: this
                });
            } else {
                callback.call(this);
            }
            this.explainedLines = [];
        },

        /**
         *  Puts the message on a queue of messages to give to the user.
         *  Messages are given only after previous messages have been given.
         *  @memberof Interviewer.prototype
         *  @param {*} message The message to present.  Can be anything with
         *      a toString() method.
         *  @param {Object} [params]
         *  @param {function} [params.whenWritten] A callback called when the
         *      message is written to chat.
         *  @param {function} [params.whenRead] A callback called when the
         *      message is done being read to the user.
         *  @param {Object} [params.thisArg] The "this" argument to apply to
         *      the callbacks.
         */
        addMessage: function (message, params) {
            var self = this;
            params = params || {};
            message = message.toString();
            var whenWritten = params["whenWritten"] || _.noop;
            var whenRead = params["whenRead"] || _.noop;
            var thisArg = params["thisArg"] || this;
            this.speakingQueue.enqueue(function (nextMessage) {
                self._textBox.addMessage(message);
                whenWritten.call(thisArg);
                meSpeak.speak(message, {}, function () {
                    whenRead.call(thisArg);
                    nextMessage();
                });
            });
        },

        /**
         *  Searches code near where the user is typing to see if there's
         *  something that can be commented on.  If so, a comment is made.
         *  @memberof Interviewer.prototype
         */
        generateComment: function () {
            var row = this._editor.getCursorPosition().row - 1;
            var lines = this._editor.getValue().split("\n");
            var comment = null;
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
         *  @return {?Phrase} Returns null if no comment can be made.
         *      Otherwise, the comment is returned as a Phrase.
         */
        getCommentFrom: function (line, number) {
            if (_.contains(this.explainedLines, number)) return;
            var variables = /(\w*)\s*=/.exec(line);
            if (_.contains(line, "if")) {
                this.explainedLines.push(number);
                return this.phrases["conditionalComment"].withContext({
                    "line": line
                });
            } else if (_.contains(line, "while") || _.contains(line, "for")) {
                this.explainedLines.push(number);
                return this.phrases["loopComment"].withContext({
                    "line": line
                });
            } else if (variables.length > 1) {
                this.explainedLines.push(number);
                return this.phrases["variableComment"].withContext({
                    "line": line,
                    "variable": variables[1]
                });
            } else {
                return false;
            }
        },

        /**
         *  Evaluates the user's code.  Gives feedback, and moves on to the
         *  next question if the answer was correct.
         *  @memberof Interviewer.prototype
         *  @todo  data.result will have a compilemessage property, which you
         *      can check for syntax errors.
         *  @todo  figure out how to make general boiler plate for functions
         *      with an arbitrary number of parameters
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
                    this.addMessage(this.phrases["failedAllTests"]);
                } else if (numSuccesses < numFailures) {
                    this.addMessage(this.phrases["failedSomeTests"]);
                } else {
                    this.addMessage(this.phrases["failedFewTests"].withContext({
                        "example": {"choose": failedCases}
                    }));
                }
            } else {
                this.addMessage(this.phrases["passedAllTests"]);
                setTimeout(function () {
                    self.getNextQuestionOr(function () {
                        self._timer.stopTimer();
                        self.addMessage(this.phrases["finishedQuestions"]);
                        self.endInterview();
                    });
                }, 3000)
            }
        }
    });
    return Interviewer;
});
