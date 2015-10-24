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

    var Timer = declare([_WidgetBase], {
        constructor: function (args) {
            args = args || {};
            var id = args.id || "timer";
            if (id[0] !== "#") {
                id = "#" + id;
            }
            this.paused = false;
            this.domNode = query(id)[0];
            this.domNode.innerHTML = "";
            this.seconds = Math.round(args.minutes * 60 || 1 * 60);
        },
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
        stopTimer: function() {
            this.paused = true;
        },
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
