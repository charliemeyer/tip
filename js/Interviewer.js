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
            numMessages = 0;
            maxMessages = 10;
            setTimeout(function message() {
                self.addMessage("Test message " + ++numMessages);
                if (numMessages < maxMessages) {
                    setTimeout(message, 5000);
                }
            }, 5000);
        },

        addMessage: function (message) {
            this.textBox.addMessage(message);
        }
    });

    return Interviewer;
});