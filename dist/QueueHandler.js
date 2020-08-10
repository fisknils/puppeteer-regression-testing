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
     * Emits a notice
     *
     * @param method The calling method's name.
     * @param message A string message.
     * @param params Arguments of the calling method.
     */
    notice(method, message, params) {
        const notice = { method, message, params };
        this.emit("notice", notice);
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
        this.queue[i] = Object.assign({}, item, modified);
        this.notice("update", "Updated state of queued item", arguments);
    }
    /**
     * Constructs a proper Queue item
     *
     * @param item An item of any type to queue
     */
    QItem(item) {
        if (this.hasItem(item)) {
            this.emit("notice", "QItem", "Item already exists in queue", arguments);
            return;
        }
        this.queue.push({
            item: item,
            enqueued: +new Date(),
            status: "waiting",
        });
        this.notice("QItem", "Item was added to queue", arguments);
    }
    /**
     *
     * @param item An item of any type to queue.
     */
    enqueue(item) {
        this.notice("enqueue", "Attempting to add item to queue", arguments);
        this.QItem(item);
    }
    /**
     * @return An item from the queue.
     */
    shiftQueue() {
        this.notice("shiftQueue", "shiftQueue called", arguments);
        const matches = where(this.queue, { status: "waiting" }, 1);
        if (!matches.length) {
            this.notice("shiftQueue", "No unhandled items in queue", arguments);
            return null;
        }
        const match = matches.pop();
        this.update(match, { status: "running" });
        return match.item;
    }
}
exports.QueueHandler = QueueHandler;
//# sourceMappingURL=QueueHandler.js.map