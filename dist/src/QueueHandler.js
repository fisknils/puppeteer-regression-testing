"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueHandler = void 0;
const events_1 = require("events");
const where = (array, where, limit = 0) => {
    const results = array.filter((item) => {
        const _queued = JSON.stringify(item);
        const _comparison = JSON.stringify(Object.assign({}, item, where));
        return _queued === _comparison;
    });
    if (!limit) {
        return results;
    }
    return results.splice(0, limit);
};
class QueueHandler extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.queue = [];
    }
    /**
     * Checks if an item already is in the queue, processed or not.
     *
     * @param item An item of any type to look for within Queue.
     */
    hasItem(item) {
        return !!where(this.queue, { item }).length;
    }
    /**
     * Updates a queued item's properties.
     *
     * @param item A queued item
     * @param modified The properties to update
     */
    update(item, modified) {
        const i = this.queue.indexOf(item);
        const queueItem = this.queue[i];
        if (queueItem === Object.assign({}, queueItem, modified)) {
            return false;
        }
        this.queue[i] = Object.assign({}, item, modified);
        return true;
    }
    /**
     *
     * @param item An item of any type to queue.
     */
    enqueue(item) {
        if (this.hasItem(item)) {
            return false;
        }
        this.queue.push({
            item: item,
            enqueued: +new Date(),
            status: "waiting",
        });
        return true;
    }
    /**
     * @return An item from the queue.
     */
    shiftQueue() {
        const matches = where(this.queue, { status: "waiting" }, 1);
        if (!matches.length) {
            return null;
        }
        const match = matches.pop();
        this.update(match, { status: "running" });
        return match.item;
    }
    markComplete(item) {
        const matches = where(this.queue, { item: item }, 1);
        if (!matches.length)
            return false;
        const match = matches.pop();
        const res = this.update(match, { status: "done" });
        if (!this.Running.length && !this.Waiting.length) {
            this.emit("done");
        }
        return res;
    }
    get Completed() {
        return where(this.queue, { status: "done" });
    }
    get Running() {
        return where(this.queue, { status: "running" });
    }
    get Waiting() {
        return where(this.queue, { status: "waiting" });
    }
}
exports.QueueHandler = QueueHandler;
