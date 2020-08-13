import { EventEmitter } from "events";
const stringify = require("json-stringify-safe");

export class Logger extends EventEmitter {
  log(type: LogType, params: any) {
    const typeStringified = [type, "stringified"].join("-");
    const paramsStringified = stringify(params);

    this.emit(type, params);
    this.emit(typeStringified, paramsStringified);
  }

  error(label: string, data: any): void {
    this.log("error", { label, data });
  }

  warning(label: string, data: any): void {
    this.log("warning", { label, data });
  }

  notice(label: string, data: any): void {
    this.log("notice", { label, data });
  }

  status(label: string, data: any, verbosity: number = 0): void {
    this.log("status", { label, data });
  }
}

export type LogType = "error" | "warning" | "notice" | "status";
