"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const events_1 = require("events");
const v8_1 = require("v8");
const stringify = require("json-stringify-safe");
class Logger extends events_1.EventEmitter {
    log(type, label, data = {}) {
        const stringified = stringify(Object.assign({}, data));
        const message = {
            label,
            data,
        };
        this.emit(type, message);
        this.emit(`${type}-serialized`, v8_1.serialize(message));
    }
}
exports.Logger = Logger;
