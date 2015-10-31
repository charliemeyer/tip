define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dojo/_base/fx",
        "dojo/query",
        "dojo/dom-construct"
    ], function (
        declare,
        _WidgetBase,
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
    var Timer = declare([_WidgetBase], {
        /**
         *  @constructor
         *  @function
         *  @memberof Timer.prototype
         *  @param {Object} args
         *  @param {string} [args.id="timer"] The id of the HTML element to
         *      transform into the timer.
         *  @param {number} args.minutes The number of minutes the timer should
         *      start at.
         *  @todo Instead of turning the div into this thing's domNode, the
         *      more typical way is to create a completely new domNode and
         *      get passed the parent element.
         */
        constructor: function (args) {
            args = args || {};
            var id = args.id || "timer";
            if (id[0] !== "#") {
                id = "#" + id;
            }
            /**
             *  Whether the timer is paused or running.
             *  @name paused
             *  @type {boolean}
             *  @memberof Timer.prototype
             */
            this.paused = false;
            /**
             *  The node controlled by the timer.
             *  @name  domNode
             *  @type {domNode}
             *  @memberof Timer.prototype
             */
            this.domNode = query(id)[0];
            this.domNode.innerHTML = "";
            /**
             *  The number of seconds left on the timer.
             *  @name  seconds
             *  @type {number}
             *  @memberof Timer.prototype
             */
            this.seconds = Math.round(args.minutes * 60 || 1 * 60);
        },

        /**
         *  Starts running the timer.
         *  @memberof Timer.prototype
         *  @param  {function} callback Will be called when the timer stops
         *      running.  Will be passed a boolean: true if the timer was
         *      simply paused, false if it ran out of time.
         */
        runTimer: function(callback) {
            var self = this;
            setTimeout(function decrement() {
                self.seconds -= 1;
                if (!self.paused && self.seconds >= 0) {
                    setTimeout(decrement, 1000);
                } else {
                    callback(self.paused);
                    return;
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
            minutes = Math.floor(this.seconds / 60);
            seconds = this.seconds % 60;
            if (seconds < 10) {
                secondsstr = "0" + seconds.toString();
            } else {
                secondsstr = seconds.toString();
            }
            this.domNode.innerHTML = minutes.toString() + ":" + secondsstr;
        }
    });

    return Timer;
});
