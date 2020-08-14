/// <reference types="node" />
import { EventEmitter } from "events";
export declare class Logger extends EventEmitter {
    log(type: LogType, label: string, data?: object): void;
}
export declare type LogType = "error" | "warning" | "notice" | "status" | "info";
export declare type LogMessage = {
    label: string;
    data: object;
};
//# sourceMappingURL=Logger.d.ts.map