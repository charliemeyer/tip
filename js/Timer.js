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
         *  @param {Object} [args]
         *  @param {number} [args.minutes=0] The number of minutes the timer should
         *      start at.
         *  @param {?number} [args.lowerBound=0] The lower bound of the timer.
         *      If the timer is counting down, this is where it will stop.
         *      Set to a non-finite value for no lower bound.
         *  @param {?number} [args.upperBound=null] The upper bound of the timer.
         *      If the timer is counting up, this is where it will stop.
         *      Set to a non-finite value for no upper bound.
         */
        constructor: function (args) {
            args = args || {};
            /**
             *  Whether the timer is paused or running.
             *  @name _paused
             *  @private
             *  @type {boolean}
             *  @memberof Timer.prototype
             */
            this._paused = false;
            this._increment = args.increment  || -1;
            this.lowerBound = args.lowerBound || 0;
            this.upperBound = args.upperBound || null;
            /**
             *  The number of seconds left on the timer.
             *  @name  _seconds
             *  @private
             *  @type {number}
             *  @memberof Timer.prototype
             */
            this.setTime(args || 0);
        },

        postCreate: function () {
            this.inherited(arguments);
            this.renderTime();

            // Make sure, if timer is already running, subsequent calls don't
            //   go through and mess things up
            var _runTimerBase = this.runTimer;
            this.runTimer = _.once(this.runTimer);
            this.on("pause, end", function () {
                this.runTimer = _.once(_runTimerBase);
            });
        },

        /**
         *  Sets the time currently showing on the timer.
         *  @memberOf Timer.prototype
         *  @param {number|object} newTime
         */
        setTime: function (newTime) {
            var seconds;
            if (_.isObject(newTime)) {
                seconds = newTime.seconds || 0;
                seconds += (newTime.minutes || 0) * 60;
                seconds += (newTime.hours || 0) * 60 * 60;
                seconds += (newTime.days || 0) * 24 * 60 * 60;
            } else {
                seconds = newTime.valueOf();
            }
            this._seconds = Math.round(seconds);
        },

        /**
         *  Fired when the timer starts running.
         *  @event Timer~start
         */
        /**
         *  Fires when the timer is paused, ie. it has stopped running but
         *  not yet hit its upper or lower bound.
         *  @event Timer~pause
         */
        /**
         *  Fires when the timer stops because it has hit an upper or
         *  lower bound.
         *  @event Timer~end
         */
        /**
         *  Starts running the timer.
         *  @memberof Timer.prototype
         */
        runTimer: function() {
            var self = this;
            this._paused = false;
            var interval = 1000 * Math.abs(this._increment);
            function inBounds(seconds) {
                return (!_.isFinite(self.lowerBound) || seconds > self.lowerBound) &&
                    (!_.isFinite(self.upperBound) || seconds < self.upperBound);
            }

            this.emit("start");
            setTimeout(function increment() {
                self._seconds += self._increment;
                if (!self._paused && inBounds(self._seconds)) {
                    setTimeout(increment, interval);
                } else {
                    self.emit(self.paused ? "pause" : "end");
                }
                self.renderTime();
            }, interval);
        },

        /**
         *  Runs the timer as a countdown.
         *  @memberOf Timer.prototype
         */
        countDown: function () {
            this._increment = -Math.abs(this._increment);
            this.runTimer();
        },

        /**
         *  Runs the timer, counting up.
         *  @memberOf Timer.prototype
         */
        countUp: function () {
            this._increment = Math.abs(this._increment);
            this.runTimer();
        },

        /**
         *  Pauses the timer, freezing the display at its current value.
         *  @memberof Timer.prototype
         */
        stopTimer: function() {
            this._paused = true;
        },

        /**
         *  Displays the current value of the timer on the domNode, in
         *  M:SS format.
         *  @memberof Timer.prototype
         */
        renderTime: function() {
            this.timeArea.innerHTML = this._formatTime(this._seconds);
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
            var str = (seconds < 0) ? "-" : "";
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
