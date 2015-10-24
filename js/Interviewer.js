define([
        "dojo/_base/declare",
        "js/lodash"
    ], function (
        declare,
        _
    ) {

    var Interviewer = declare(null, {
        constructor: function (args) {
            var self = this;
            this.textBox = args.textBox;
            this.timer = args.timer;
            numMessages = 0;
            maxMessages = 10;
            setTimeout(function message() {
                self.addMessage("Test message " + ++numMessages);
                if (numMessages < maxMessages) {
                    setTimeout(message, 5000);
                }
            }, 5000);
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