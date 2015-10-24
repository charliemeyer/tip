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
            this.addMessage(intro + question);
        },

        addMessage: function (message) {
            this.textBox.addMessage(message);
        }
    });

    return Interviewer;
});
