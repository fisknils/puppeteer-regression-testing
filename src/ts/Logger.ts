import { EventEmitter } from "events";
const PouchDB = require("pouchdb");
const stringify = require("json-stringify-safe");

type LogType = "error" | "warning" | "notice" | "status";

export class Logger extends EventEmitter {
  DB: PouchDB.Database;

  constructor(namespace: string) {
    super();
    const db_files = "db/" + namespace + "-Logger";
    this.DB = new PouchDB(db_files);
  }

  log(type: LogType, params: any) {
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

  error(error: any, data: any): void {
    this.log("error", { error, data });
  }

  warning(data: any): void {
    this.log("warning", { data });
  }

  notice(data: any): void {
    this.log("notice", { data });
  }

  status(data: any): void {
    this.log("status", { data });
  }
}
