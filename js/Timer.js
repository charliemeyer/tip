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
            this.defaultTimeOut = args.defaultTimeOut || 60 * 1000;
            this.domNode = query(id)[0];
            this.domNode.innerHTML = "FUCK";
            this.seconds = args.minutes * 60 || 1 * 60;
            this.paused = false;
            this.runTimer();
        },
        runTimer: function() {
            var self = this;
            setTimeout(function decrement() {
                self.seconds -= 1;
                if (!self.paused && self.seconds >= 0) {
                    setTimeout(decrement, 1000);
                } else {
                    alert("Times Up!");
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
