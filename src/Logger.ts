import { EventEmitter } from "events";

const stringify = require("json-stringify-safe");

export class Logger extends EventEmitter {
  log(type: LogType, label: string, data: object = {}) {
    const stringifiedData = stringify(Object.assign({}, data));

    const message: LogMessage = {
      label,
      data,
      stringifiedData,
    };

    this.emit(type, message);
    this.emit(`${type}-serialized`, message);
  }
}

export type LogType = "error" | "warning" | "notice" | "status" | "info";
export type LogMessage = {
  label: string;
  data: Object;
  stringifiedData: string;
};
