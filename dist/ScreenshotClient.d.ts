/// <reference types="node" />
import * as Puppeteer from "puppeteer";
import { EventEmitter } from "events";
import { Logger } from "./Logger";
import { QueueHandler } from "./QueueHandler";
export declare class ScreenshotClient extends EventEmitter {
    logger: Logger;
    protected queue: QueueHandler;
    protected browser?: Puppeteer.Browser;
    protected tabOne?: Puppeteer.Page;
    protected tabTwo?: Puppeteer.Page;
    protected quitTimeout: any;
    protected isReady: boolean;
    protected isBusy: boolean;
    protected isClosed: boolean;
    protected _tick: number;
    constructor();
    init(): Promise<boolean>;
    addJob(job: Job): Promise<void>;
    onResult(callback: Function): Promise<void>;
    protected getWork(): Promise<void>;
    protected startJob(job: Job): Promise<void>;
    protected tick(): Promise<void>;
    protected ready(): Promise<void>;
    protected close(): Promise<void>;
    protected reset(): Promise<void>;
    protected dualPage(callback: (page: Puppeteer.Page) => Promise<any>): Promise<[any, any]>;
    protected visit(URLs: URL[]): Promise<[any, any]>;
    protected setWidth(width: number): Promise<void>;
    protected screenshot(): Promise<{
        one: string;
        two: string;
    }>;
    protected compareURLs(job: Job): Promise<void>;
    protected getScreenshotDiff(Screenshots: Screenshot[]): Promise<ScreenshotDiff>;
    protected getDomCount(selector?: string): Promise<number[]>;
}
export declare type InjectJS = {
    enabled: boolean;
    script: string;
};
export declare type ScreenshotDiff = {
    Width: number;
    Path: string;
    Base64: string | null;
    Screenshots: Screenshot[];
    misMatchPercentage: number;
    isSameDimensions: boolean;
    DOMCountDiff: number;
};
export declare type Screenshot = {
    Base64: string;
    URL: string;
    Width: number;
    DOMCount: number;
};
export declare type IncompleteScreenshot = {
    Base64: string | null;
    URL: string | null;
    Width: number | null;
};
export declare type Job = {
    URLs: URL[];
    Viewports: number[];
    InjectJS: InjectJS;
};
//# sourceMappingURL=ScreenshotClient.d.ts.map