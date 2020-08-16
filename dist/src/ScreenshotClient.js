"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotClient = void 0;
const Puppeteer = require("puppeteer");
const events_1 = require("events");
const util_1 = require("util");
const Logger_1 = require("./Logger");
const QueueHandler_1 = require("./QueueHandler");
const compare = util_1.promisify(require("resemblejs").compare);
const puppeteer = require("puppeteer");
class ScreenshotClient extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = new Logger_1.Logger();
        this.queue = new QueueHandler_1.QueueHandler();
        this.isReady = true;
        this.isBusy = false;
        this.isClosed = false;
        this.isWorking = false;
        this.quit = false;
        this.on("add-job", (job) => this.addJob(job));
    }
    async addJob(job) {
        this.logger.log("status", "addJob", { job });
        const res = this.queue.enqueue(job);
        if (!this.isWorking && res) {
            this.tick();
        }
        return res;
    }
    async onResult(callback) {
        this.on("result", (result) => callback(result));
    }
    async getWork() {
        const job = this.queue.shiftQueue();
        if (!job) {
            return false;
        }
        this.logger.log("status", "getWork", { job });
        await this.startJob(job);
        return true;
    }
    async startJob(job) {
        this.emit("start-job");
        this.logger.log("status", "startJob", { job });
        if (job.URLs.length !== 2) {
            throw new Error('Expected exactly 2 URLs, but got ' + job.URLs.length);
        }
        const browser = await Puppeteer.launch();
        await this.compareURLs(browser, job);
        await browser.close();
        this.emit('did-job', { job });
    }
    async tick() {
        if (this.isWorking) {
            return;
        }
        this.isWorking = true;
        const res = await this.getWork();
        this.isWorking = false;
        if (res && !this.quit) {
            setTimeout(() => this.tick(), 500);
        }
    }
    async visit(p1, p2, URLs) {
        this.logger.log("status", "visit", { URLs });
        if (URLs.length !== 2) {
            throw new Error('Expected exactly 2 URLs, but got ' + URLs.length);
        }
        const [url1, url2] = URLs;
        await p1.goto(url1.toString(), { waitUntil: "networkidle0" });
        await p2.goto(url2.toString(), { waitUntil: "networkidle0" });
    }
    async setWidth(p1, p2, width) {
        this.logger.log("status", "setWidth", { width });
        const viewport = {
            width: width,
            height: 100
        };
        await p1.setViewport(viewport);
        await p2.setViewport(viewport);
    }
    async screenshot(p1, p2, selector = "body") {
        this.logger.log("status", "screenshot");
        const el1 = await p1.$(selector);
        const el2 = await p2.$(selector);
        const screenshot1 = await p1.screenshot({ encoding: "base64", fullPage: true });
        const screenshot2 = await p2.screenshot({ encoding: 'base64', fullPage: true });
        return { screenshot1, screenshot2 };
    }
    async InjectJS(p1, p2, script) {
        await p1.evaluate((script) => eval(script), script);
        await p2.evaluate((script) => eval(script), script);
    }
    async getDomCount(p1, p2, selector = "*") {
        this.logger.log("status", "getDomCount", []);
        const one = await p1.$$(selector);
        const two = await p2.$$(selector);
        return [one.length, two.length];
    }
    async compareURLs(browser, job) {
        const { URLs, Viewports, InjectJS } = Object.assign({}, job);
        const [urlOne, urlTwo] = URLs;
        let screenshot = {
            Base64: null,
            URL: null,
            Width: null,
        };
        this.logger.log("status", "compareURLs", { job });
        const p1 = await browser.newPage();
        const p2 = await browser.newPage();
        await this.visit(p1, p2, URLs);
        // Maybe inject JS
        if (InjectJS.enabled)
            await this.InjectJS(p1, p2, InjectJS.script);
        for (let vi in Viewports) {
            // Set Viewport
            screenshot.Width = Viewports[vi];
            await this.setWidth(p1, p2, screenshot.Width);
            // Take screenshots
            const { screenshot1, screenshot2 } = await this.screenshot(p1, p2);
            // Count DOM Elements
            const [count1, count2] = await this.getDomCount(p1, p2);
            // Calculate Diff
            const diff = await this.getScreenshotDiff([
                {
                    URL: urlOne.toString(),
                    Base64: screenshot1,
                    DOMCount: count1,
                    Width: screenshot.Width
                },
                {
                    URL: urlTwo.toString(),
                    Base64: screenshot2,
                    DOMCount: count2,
                    Width: screenshot.Width
                }
            ]);
            diff.Base64 = diff.Base64.replace(/^data:image\/png;base64,/, "");
            this.emit("result", diff);
        }
        this.logger.log("status", "comparedURL", {
            URLs,
            Viewports,
            InjectJS,
        });
        this.emit("ready");
    }
    async getScreenshotDiff(Screenshots) {
        this.logger.log("status", "getScreenshotDiff", []);
        const [one, two] = Screenshots;
        const res = await compare(Buffer.from(one.Base64, "base64"), Buffer.from(two.Base64, "base64"));
        const { isSameDimensions, misMatchPercentage } = res;
        const Base64 = res.getImageDataUrl();
        const { pathname } = new URL(one.URL);
        const [countOne, countTwo] = [one.DOMCount, two.DOMCount];
        const DOMCountDiff = +countOne - +countTwo;
        const ScreenshotDiff = {
            Width: one.Width,
            Path: pathname,
            Base64,
            Screenshots,
            isSameDimensions,
            misMatchPercentage,
            DOMCountDiff,
        };
        return ScreenshotDiff;
    }
}
exports.ScreenshotClient = ScreenshotClient;
