import * as Puppeteer from "puppeteer";
import { EventEmitter } from "events";
import { promisify } from "util";
import { ResembleComparisonResult } from "resemblejs";
import { Logger } from "./Logger";
import { QueueHandler } from "./QueueHandler";

const stringify = require("json-stringify-safe");
const compare = promisify(require("resemblejs").compare);
const puppeteer = require("puppeteer");

export class ScreenshotClient extends EventEmitter {
  public logger: Logger = new Logger();
  protected queue: QueueHandler = new QueueHandler();
  protected browser?: Puppeteer.Browser;
  protected tabOne?: Puppeteer.Page;
  protected tabTwo?: Puppeteer.Page;
  protected quitTimeout: any;
  protected isReady: boolean = true;
  protected isBusy: boolean = false;
  protected isClosed: boolean = false;
  protected _tick: number = 0;

  constructor() {
    super();

    this.once("ready", () => this.tick());
    this.on("tick", this.getWork);
    this.on("add-job", this.addJob);
    this.on("start-job", () => (this.isBusy = true));
    this.on("did-job", () => (this.isBusy = false));
  }

  public async init() : Promise<boolean> {
    this.logger.log("status", "init", []);

    try {
      this.browser = await puppeteer.launch();
      if (!this.browser) {
        throw new Error("Browser launch failed");
      }
      this.tabOne = await this.browser.newPage();
      this.tabTwo = await this.browser.newPage();
      this.isClosed = false;
      this.emit('did-init');
      this.ready();
      return true;
    } catch (e) {
      this.logger.log("error", "init", e);
      return false;
    }
  }

  public async addJob(job: Job) {
    this.logger.log("status", "addJob", { job });
    this.queue.enqueue(job);
  }

  public async onResult(callback: Function) {
    this.on('result', result => callback(result));
  }

  protected async getWork() {
    if (this.isBusy || !this.isReady) {
      return;
    }

    const job: Job = this.queue.shiftQueue();

    if (job) {
      this.logger.log("status", "getWork", []);
      await this.startJob(job);
      return;
    }
    this.logger.log("status", "idle", []);
  }

  protected async startJob(job: Job) {
    await this.reset();
    this.emit("start-job");
    this.logger.log("status", "startJob", { job });

    await this.compareURLs(job)
      .then(() => this.emit("did-job", { job }))
      .catch((e) => this.emit("error", { method: "startJob", data: e }));
  }

  protected async tick() {
    this._tick++;
    await this.getWork();

    setTimeout(() => this.tick(), 1000);
  }

  protected async ready() {
    this.emit("ready");
    this.isReady = true;
  }

  protected async close() {
    if (this.browser) await this.browser.close();
    this.isClosed = true;
  }

  protected async reset() {
    await this.close();
    await this.init();
  }

  protected async dualPage(callback: (page: Puppeteer.Page) => Promise<any>) {
    if (!this.tabOne || !this.tabTwo) {
      return;
    }

    return await Promise.all([callback(this.tabOne), callback(this.tabTwo)]);
  }

  protected async visit(URLs: URL[]) {
    this.logger.log("status", "visit", { URLs });

    let urls = [].concat(URLs);

    const res = this.dualPage((page) =>
      page.goto(urls.shift().toString(), { waitUntil: "networkidle0", timeout: 0 })
    );

    return res;
  }

  protected async setWidth(width: number) {
    this.logger.log("status", "setWidth", { width });
    await this.dualPage((page) =>
      page.setViewport({ width: width, height: 100 })
    );
  }

  protected async screenshot() {
    this.logger.log("status", "screenshot");
    const [one, two] = [
      await this.tabOne.screenshot({
        encoding: "base64",
        fullPage: true,
      }),
      await this.tabTwo.screenshot({
        encoding: "base64",
        fullPage: true,
      }),
    ];
    return { one, two };
  }

  protected async compareURLs(job: Job): Promise<void> {
    const { URLs, Viewports, InjectJS } = job;
    let screenshot: IncompleteScreenshot = {
      Base64: null,
      URL: null,
      Width: null,
    };

    this.logger.log("status", "compareURLs", { job });

    await this.reset();
    await this.visit(URLs);
    await this.getDomCount("body");

    if (InjectJS.enabled) {
      this.logger.log("status", "Inject JS", { InjectJS });
      await this.dualPage((page) =>
        page.evaluate((InjectJS) => eval(InjectJS.script), InjectJS)
      );
    }

    for (let vi in Viewports) {
      screenshot.Width = Viewports[vi];
      await this.setWidth(screenshot.Width);

      const { one, two } = await this.screenshot();
      const [urlOne, urlTwo] = URLs;

      const [countOne, countTwo] = await this.getDomCount();

      const diff: ScreenshotDiff = await this.getScreenshotDiff([
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

    this.logger.log("status", "comparedURL", {
      URLs,
      Viewports,
      InjectJS,
    });
    this.emit("done");
  }

  protected async getScreenshotDiff(
    Screenshots: Screenshot[]
  ): Promise<ScreenshotDiff> {
    this.logger.log("status", "getScreenshotDiff", []);
    const [one, two] = Screenshots;

    const res: ResembleComparisonResult = await compare(
      Buffer.from(one.Base64, "base64"),
      Buffer.from(two.Base64, "base64")
    );

    const { isSameDimensions, misMatchPercentage } = res;
    const Base64 = res.getImageDataUrl();
    const { pathname } = new URL(one.URL);
    const [countOne, countTwo] = [one.DOMCount, two.DOMCount];
    const DOMCountDiff = +countOne - +countTwo;

    const ScreenshotDiff: ScreenshotDiff = {
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

  protected async getDomCount(selector: string = "*"): Promise<number[]> {
    this.logger.log("status", "getDomCount", []);
    const [one, two] = await this.dualPage((page) => page.$$(selector));
    return [one.length, two.length];
  }
}

export type InjectJS = {
  enabled: boolean;
  script: string;
};

export type ScreenshotDiff = {
  Width: number;
  Path: string;
  Base64: string | null;
  Screenshots: Screenshot[];
  misMatchPercentage: number;
  isSameDimensions: boolean;
  DOMCountDiff: number;
};

export type Screenshot = {
  Base64: string;
  URL: string;
  Width: number;
  DOMCount: number;
};

export type IncompleteScreenshot = {
  Base64: string | null;
  URL: string | null;
  Width: number | null;
};

export type Job = {
  URLs: URL[];
  Viewports: number[];
  InjectJS: InjectJS;
};
