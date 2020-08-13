"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const events_1 = require("events");
const stringify = require("json-stringify-safe");
class Logger extends events_1.EventEmitter {
    log(type, params) {
        const typeStringified = [type, "stringified"].join("-");
        const paramsStringified = stringify(params);
        this.emit(type, params);
        this.emit(typeStringified, paramsStringified);
    }
    error(label, data) {
        this.log("error", { label, data });
    }
    warning(label, data) {
        this.log("warning", { label, data });
    }
    notice(label, data) {
        this.log("notice", { label, data });
    }
    status(label, data, verbosity = 0) {
        this.log("status", { label, data });
    }
}
exports.Logger = Logger;
