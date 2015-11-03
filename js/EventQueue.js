define([
        "dojo/_base/declare",
        "dojo/Evented"
    ], function (
        declare,
        Evented
    ) {

    /**
     *  An EventQueue maintains a queue of events, where each event cannot
     *  begin until the one before it has ended.  Events are represented as
     *  functions, and must signal when done by calling the callback passed
     *  to them.  The queue fires an "empty" event each time it becomes
     *  empty.
     *  @class
     *  @name  EventQueue
     *  @extends {dojo.Evented}
     */
    var EventQueue = declare([Evented], {
        /**
         *  @constructor
         *  @function
         *  @memberOf EventQueue.prototype
         */
        constructor: function () {
            // Maintains the invarient: the element at index 0 is always
            //   currently executing (ie. events are not removed until they
            //   are completely finished).
            this._queue = [];
        },

        /**
         *  Add a function to the queue.  This function must signal when it
         *  is done, or else no other events will be removed from the queue.
         *  @memberOf EventQueue.prototype
         *  @param  {function} event The event to add.  It will be passed a
         *      single parameter, which is a function to call when the event
         *      is done, ie. when the next event from the queue can be
         *      processed.
         */
        enqueue: function (event) {
            var self = this;
            function processMessage() {
                self._queue.shift();
                if (self._queue.length > 0) {
                    self._queue[0](processMessage);
                } else {
                    self.emit("empty");
                }
            }
            this._queue.push(event);
            if (this._queue.length === 1) {
                event(processMessage);
            }
        },

        /**
         *  @memberOf EventQueue.prototype
         *  @return {Boolean} Whether nothing remains on the queue.
         */
        isEmpty: function () {
            return this._queue.length === 0;
        }
    });

    return EventQueue;
});
