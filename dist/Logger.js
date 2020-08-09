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
exports.Logger = void 0;
var events_1 = require("events");
var PouchDB = require("pouchdb");
var stringify = require("json-stringify-safe");
var Logger = /** @class */ (function (_super) {
    __extends(Logger, _super);
    function Logger(namespace) {
        var _this = _super.call(this) || this;
        var db_files = "db/" + namespace + "-Logger";
        _this.DB = new PouchDB(db_files);
        return _this;
    }
    Logger.prototype.log = function (type, params) {
        var timestamp = +new Date();
        var typeStringified = [type, "stringified"].join("-");
        var paramsStringified = stringify(params);
        this.emit(type, params);
        this.emit(typeStringified, paramsStringified);
        var doc = {
            type: type,
            params: params,
            timestamp: timestamp,
        };
        this.DB.post(doc);
    };
    Logger.prototype.error = function (error, data) {
        this.log("error", { error: error, data: data });
    };
    Logger.prototype.warning = function (data) {
        this.log("warning", { data: data });
    };
    Logger.prototype.notice = function (data) {
        this.log("notice", { data: data });
    };
    Logger.prototype.status = function (data) {
        this.log("status", { data: data });
    };
    return Logger;
}(events_1.EventEmitter));
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map