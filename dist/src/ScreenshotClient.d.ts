/// <reference types="node" />
import * as Puppeteer from "puppeteer";
import { EventEmitter } from "events";
import { Logger } from "./Logger";
import { QueueHandler } from "./QueueHandler";
export declare class ScreenshotClient extends EventEmitter {
    logger: Logger;
    protected queue: QueueHandler;
    protected isReady: boolean;
    protected isBusy: boolean;
    protected isClosed: boolean;
    protected isWorking: boolean;
    protected quit: boolean;
    constructor();
    addJob(job: Job): Promise<boolean>;
    onResult(callback: Function): Promise<void>;
    getWork(): Promise<boolean>;
    protected startJob(job: Job): Promise<void>;
    protected tick(): Promise<void>;
    protected visit(p1: Puppeteer.Page, p2: Puppeteer.Page, URLs: URL[]): Promise<void>;
    protected setWidth(p1: Puppeteer.Page, p2: Puppeteer.Page, width: number): Promise<void>;
    protected screenshot(p1: Puppeteer.Page, p2: Puppeteer.Page, selector?: string): Promise<any>;
    protected InjectJS(p1: Puppeteer.Page, p2: Puppeteer.Page, script: string): Promise<void>;
    protected getDomCount(p1: Puppeteer.Page, p2: Puppeteer.Page, selector?: string): Promise<number[]>;
    protected compareURLs(browser: Puppeteer.Browser, job: Job): Promise<void>;
    protected getScreenshotDiff(Screenshots: Screenshot[]): Promise<ScreenshotDiff>;
}
export declare type InjectJS = {
    enabled: boolean;
    script: string;
};
export declare type ScreenshotDiff = {
    Width: number;
    Path: string;
    Base64: string;
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