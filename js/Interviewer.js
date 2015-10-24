define([
        "dojo/_base/declare",
        "js/lodash",
        "dojo/domReady!"
    ], function (
        declare,
        _
    ) {

    var Interviewer = declare(null, {
        constructor: function (args) {
            var self = this;
            this.textBox = args.textBox;
            var intro = "Hi! My name is Microsoft Sam. Let's get things started with a coding question. This is my question: ";
            var question = document.getElementById('question-prompt').innerHTML;
            // this.addMessage(intro + question); // TODO ADD THIS BACK IN. (i removed it b/c annoying)

            this.timer = args.timer;
            this.timer.runTimer(function () {
                self.addMessage("Time is up!  We'll get back to you in a few days.")
            });
        },

        addMessage: function (message) {
            this.textBox.addMessage(message);
        }
    });

    return Interviewer;
});
