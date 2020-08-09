"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueHandler = void 0;
var events_1 = require("events");
var where = function (array, where, limit) {
    if (limit === void 0) { limit = 0; }
    var results = array.filter(function (item) {
        var _queued = JSON.stringify(item);
        var _comparison = JSON.stringify(Object.assign({}, item, where));
        return _queued === _comparison;
    });
    if (!limit) {
        return results;
    }
    return results.splice(0, limit);
};
var QueueHandler = /** @class */ (function (_super) {
    __extends(QueueHandler, _super);
    function QueueHandler() {
        var _this = _super.call(this) || this;
        _this.queue = [];
        return _this;
    }
    QueueHandler.prototype.notice = function (method, message, params) {
        var notice = { method: method, message: message, params: params };
        this.emit("notice", notice);
    };
    QueueHandler.prototype.hasItem = function (item) {
        return where(this.queue, { item: item }).length;
    };
    QueueHandler.prototype.update = function (item, modified) {
        var i = this.queue.indexOf(item);
        this.queue[i] = Object.assign({}, item, modified);
        this.notice("update", "Updated state of queued item", arguments);
    };
    QueueHandler.prototype.QItem = function (item) {
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
    };
    QueueHandler.prototype.enqueue = function (item) {
        this.notice("enqueue", "Attempting to add item to queue", arguments);
        this.QItem(item);
    };
    QueueHandler.prototype.shiftQueue = function () {
        this.notice("shiftQueue", "shiftQueue called", arguments);
        var matches = where(this.queue, { status: "waiting" }, 1);
        if (!matches.length) {
            this.notice("shiftQueue", "No unhandled items in queue", arguments);
            return null;
        }
        var match = matches.pop();
        this.update(match, { status: "running" });
        return match.item;
    };
    return QueueHandler;
}(events_1.EventEmitter));
exports.QueueHandler = QueueHandler;
//# sourceMappingURL=QueueHandler.js.map