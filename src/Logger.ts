import { EventEmitter } from "events";
import { serialize } from "v8";

const stringify = require("json-stringify-safe");

export class Logger extends EventEmitter {
  log(type: LogType, label: string, data: object = {}) {
    const stringified = stringify(Object.assign({}, data));

    const message: LogMessage = {
      label,
      data,
    };

    this.emit(type, message);
    this.emit(`${type}-serialized`, serialize(message));
  }
}

export type LogType = "error" | "warning" | "notice" | "status" | "info";
export type LogMessage = {
  label: string;
  data: object;
};
