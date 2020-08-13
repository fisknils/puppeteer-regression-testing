/// <reference types="node" />
import { EventEmitter } from "events";
export declare class Logger extends EventEmitter {
    log(type: LogType, params: any): void;
    error(label: string, data: any): void;
    warning(label: string, data: any): void;
    notice(label: string, data: any): void;
    status(label: string, data: any, verbosity?: number): void;
}
export declare type LogType = "error" | "warning" | "notice" | "status";
