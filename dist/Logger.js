"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const events_1 = require("events");
const stringify = require("json-stringify-safe");
class Logger extends events_1.EventEmitter {
    log(type, label, data = {}) {
        const stringifiedData = stringify(Object.assign({}, data));
        const message = {
            label,
            data,
            stringifiedData,
        };
        this.emit(type, message);
        this.emit(`${type}-serialized`, message);
    }
}
exports.Logger = Logger;
