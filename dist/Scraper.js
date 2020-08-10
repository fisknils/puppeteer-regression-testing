"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scraper = void 0;
const puppeteer = require("puppeteer");
const events_1 = require("events");
const util_1 = require("util");
const Logger_1 = require("./Logger");
const QueueHandler_1 = require("./QueueHandler");
const stringify = require("json-stringify-safe");
const compare = util_1.promisify(require("resemblejs").compare);
class Scraper extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = new Logger_1.Logger("Scraper");
        this.queue = new QueueHandler_1.QueueHandler();
        this.isReady = true;
        this.isBusy = false;
        this.isClosed = false;
        this._tick = 0;
        this.on("add-job", this.addJob);
        this.on("start-job", () => (this.isBusy = true));
        this.on("did-job", () => (this.isBusy = false));
        this.on("tick", this.getWork);
        this.once("ready", () => this.tick());
        this.init();
    }
    async addJob(job) {
        this.statusUpdate("addJob", arguments);
        this.queue.enqueue(job);
    }
    async getWork() {
        this.statusUpdate("getWork", arguments);
        if (this.isBusy || !this.isReady) {
            return;
        }
        const job = this.queue.shiftQueue();
        if (job) {
            await this.startJob(job);
        }
    }
    async startJob(job) {
        await this.reset();
        this.emit("start-job");
        this.statusUpdate("startJob", arguments);
        await this.compareURLs(job)
            .then(() => this.emit("did-job", { job }))
            .catch((e) => this.emit("error", { method: "startJob", data: e }));
    }
    async init() {
        this.statusUpdate("init", arguments);
        this.emit("start-init");
        try {
            this.browser = await puppeteer.launch();
            this.tabOne = await this.browser.newPage();
            this.tabTwo = await this.browser.newPage();
            this.isClosed = false;
        }
        catch (e) {
            this.emit("error", { method: "init", data: e });
        }
        finally {
            this.emit("did-init");
            this.ready();
        }
    }
    async tick() {
        this._tick++;
        await this.getWork();
        setTimeout(() => this.tick(), 1000);
    }
    async ready() {
        this.emit("ready");
        this.isReady = true;
    }
    async close() {
        if (this.browser)
            await this.browser.close();
        this.isClosed = true;
    }
    async reset() {
        await this.close();
        await this.init();
    }
    async statusUpdate(method, args) {
        const _args = JSON.parse(stringify(args));
        this.emit("status", { method, args });
    }
    async onError(method, ex) {
        this.emit("error", { method, ex });
    }
    async dualPage(callback) {
        return await Promise.all([callback(this.tabOne), callback(this.tabTwo)]);
    }
    async visit(URLs) {
        this.statusUpdate("visit", arguments);
        let urls = [].concat(URLs);
        const res = this.dualPage((page) => page.goto(urls.shift(), { waitUntil: "networkidle0" }));
        return res;
    }
    async setWidth(width) {
        this.statusUpdate("setWidth", arguments);
        await this.dualPage((page) => page.setViewport({ width: width, height: 100 }));
    }
    async screenshot() {
        this.statusUpdate("screenshot", arguments);
        const [one, two] = [
            await this.tabOne.screenshot({ encoding: "base64" }),
            await this.tabTwo.screenshot({ encoding: "base64" }),
        ];
        return { one, two };
    }
    async compareURLs(job) {
        this.statusUpdate("compareURLs", job);
        const { URLs, Viewports, InjectJS } = job;
        await this.reset();
        await this.visit(URLs);
        await this.getDomCount("body");
        if (InjectJS.enabled) {
            this.statusUpdate("Inject JS", InjectJS);
            await this.dualPage((page) => page.evaluate(InjectJS.script));
        }
        let screenshot = {
            Base64: null,
            URL: null,
            Width: null,
        };
        for (let vi in Viewports) {
            screenshot.Width = Viewports[vi];
            await this.setWidth(screenshot.Width);
            const { one, two } = await this.screenshot();
            const [urlOne, urlTwo] = URLs;
            const [countOne, countTwo] = await this.getDomCount();
            const diff = await this.getScreenshotDiff([
                Object.assign({}, screenshot, {
                    URL: urlOne,
                    Base64: one,
                    DOMCount: countOne,
                }),
                Object.assign({}, screenshot, {
                    URL: urlTwo,
                    Base64: two,
                    DOMCount: countTwo,
                }),
            ]);
            diff.Base64 = diff.Base64.replace(/^data:image\/png;base64,/, "");
            this.emit("result", diff);
        }
        this.statusUpdate("comparedURL", {
            URLs,
            Viewports,
            InjectJS,
        });
        this.emit("done");
    }
    async getScreenshotDiff(Screenshots) {
        this.statusUpdate("getScreenshotDiff", arguments);
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
    async getDomCount(selector = "*") {
        this.statusUpdate("getDomCount", arguments);
        const [one, two] = await this.dualPage((page) => page.$$(selector));
        return [one.length, two.length];
    }
}
exports.Scraper = Scraper;
