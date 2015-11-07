define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!js/templates/timer.html",
        "dojo/_base/fx",
        "dojo/query",
        "dojo/dom-construct"
    ], function (
        declare,
        _WidgetBase,
        _TemplatedMixin,
        timerTemplateString,
        fx,
        query,
        domConstruct
    ) {


    /**
     *  The Timer class manages a timer widget on the page.  It counts down
     *  from a starting value until it hits zero or is paused.
     *  @class
     *  @name  Timer
     *  @extends dijit._WidgetBase
     */
    var Timer = declare([_WidgetBase, _TemplatedMixin], {
        templateString: timerTemplateString,

        /**
         *  @constructor
         *  @function
         *  @memberof Timer.prototype
         *  @param {Object} args
         *  @param {number} args.minutes The number of minutes the timer should
         *      start at.
         */
        constructor: function (args) {
            args = args || {};
            /**
             *  Whether the timer is paused or running.
             *  @name paused
             *  @type {boolean}
             *  @memberof Timer.prototype
             */
            this.paused = false;
            /**
             *  The number of seconds left on the timer.
             *  @name  seconds
             *  @type {number}
             *  @memberof Timer.prototype
             */
            this.seconds = Math.round((args.minutes || 1) * 60);
        },

        /**
         *  Starts running the timer.
         *  @memberof Timer.prototype
         */
        runTimer: function() {
            var self = this;
            this.emit("start");
            setTimeout(function decrement() {
                self.seconds -= 1;
                if (!self.paused && self.seconds > 0) {
                    setTimeout(decrement, 1000);
                } else {
                    self.emit(self.paused ? "pause" : "end");
                }
                self.renderTime();
            }, 1000);
        },

        /**
         *  Pauses the timer, freezing the display at its current value.
         *  @memberof Timer.prototype
         */
        stopTimer: function() {
            this.paused = true;
        },

        /**
         *  Displays the current value of the timer on the domNode, in
         *  M:SS format.
         *  @memberof Timer.prototype
         */
        renderTime: function() {
            this.timeArea.innerHTML = this._formatTime(this.seconds);
        },

        /**
         *  Produces a string from the given number of seconds in the format
         *  D:HH:MM:SS.  Leading fields are omitted unless they are nonzero.
         *  The minutes field is always supplied, even if zero.
         *  All fields except the first are made into two-digit fields by
         *  adding a leading zero, if needed.
         *  @private
         *  @memberOf Timer.prototype
         *  @param  {number} seconds
         *  @return {string}
         */
        _formatTime: function (seconds) {
            var str = "";
            function stringify(num) {
                return ((str != "" && num < 10) ? "0" : "") + num.toString();
            }
            var minutes = Math.floor(seconds / 60);
            var hours = Math.floor(minutes / 60);
            var days = Math.floor(hours / 24);
            seconds %= 60;
            minutes %= 60;
            hours %= 24;

            if (days > 0) {
                str += stringify(days) + ":";
            }
            if (hours > 0) {
                str += stringify(hours) + ":";
            }
            str += stringify(minutes) + ":";
            return str + stringify(seconds);
        }
    });

    return Timer;
});
