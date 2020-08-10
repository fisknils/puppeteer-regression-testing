"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const events_1 = require("events");
const PouchDB = require("pouchdb");
const stringify = require("json-stringify-safe");
class Logger extends events_1.EventEmitter {
    constructor(namespace) {
        super();
        const db_files = "db/" + namespace + "-Logger";
        this.DB = new PouchDB(db_files);
    }
    log(type, params) {
        const timestamp = +new Date();
        const typeStringified = [type, "stringified"].join("-");
        const paramsStringified = stringify(params);
        this.emit(type, params);
        this.emit(typeStringified, paramsStringified);
        const doc = {
            type,
            params,
            timestamp,
        };
        this.DB.post(doc);
    }
    error(error, data) {
        this.log("error", { error, data });
    }
    warning(data) {
        this.log("warning", { data });
    }
    notice(data) {
        this.log("notice", { data });
    }
    status(data) {
        this.log("status", { data });
    }
}
exports.Logger = Logger;
