const puppeteer = require("puppeteer");
import { Browser, Page, ElementHandle } from "puppeteer";
import { EventEmitter } from "events";
import { promisify } from "util";
import { ResembleComparisonResult } from "resemblejs";
import { Logger } from "./Logger";
import { QueueHandler } from "./QueueHandler";

const stringify = require("json-stringify-safe");
const compare = promisify(require("resemblejs").compare);

export class Scraper extends EventEmitter {
  protected logger: Logger = new Logger("Scraper");
  protected queue: QueueHandler = new QueueHandler();
  protected browser: Browser;
  protected tabOne: Page;
  protected tabTwo: Page;
  protected quitTimeout: any;
  protected isReady: boolean = true;
  protected isBusy: boolean = false;
  protected isClosed: boolean = false;
  protected _tick: number = 0;

  constructor() {
    super();

    this.on("done", this.startQuitTimeout);
    this.on("compare-urls", this.stopQuitTimeout);
    this.on("add-job", this.addJob);
    this.on("start-job", () => (this.isBusy = true));
    this.on("did-job", () => (this.isBusy = false));
    this.on("tick", this.getWork);
    this.once("ready", () => this.tick());
    this.init();
  }

  async addJob(job: Job) {
    this.statusUpdate("addJob", arguments);
    this.queue.enqueue(job);
  }

  protected async getWork() {
    this.statusUpdate("getWork", arguments);
    if (this.isBusy || !this.isReady) {
      return;
    }
    const job: Job = this.queue.shiftQueue();
    if (job) {
      await this.startJob(job);
    }
  }

  protected async startJob(job: Job) {
    await this.reset();
    this.emit("start-job");
    this.statusUpdate("startJob", arguments);
    await this.compareURLs(job)
      .then(() => this.emit("did-job", { job }))
      .catch((e) => this.emit("error", { method: "startJob", data: e }));
  }

  protected async startQuitTimeout() {
    const seconds = 5;
    this.quitTimeout = setTimeout(() => {
      this.emit("status", "No action in 5 seconds. I think I'm done.");
      this.close();
    }, seconds * 1000);
  }

  protected async stopQuitTimeout() {
    clearTimeout(this.quitTimeout);
  }

  protected async init() {
    this.emit("status", "initializing");
    this.emit("start-init");
    try {
      this.browser = await puppeteer.launch();
      this.tabOne = await this.browser.newPage();
      this.tabTwo = await this.browser.newPage();
      this.isClosed = false;
    } catch (e) {
      this.emit("error", { method: "init", data: e });
      this.startQuitTimeout();
    } finally {
      this.emit("did-init");
      this.ready();
    }
  }

  protected async tick() {
    this._tick++;
    this.emit("tick");

    if (!this.isClosed) {
      setTimeout(() => this.tick(), 1000);
    }
  }

  protected async ready() {
    this.emit("ready");
    this.isReady = true;
  }

  protected async close() {
    if (this.browser) this.browser.close();
    this.isClosed = true;
  }

  protected async reset() {
    this.close();
    await this.init();
  }

  protected async statusUpdate(method: string, args: any) {
    const _args = JSON.parse(stringify(args));
    this.emit("status", { method, args });
  }

  protected async onError(method: string, ex: Error) {
    this.emit("error", { method, ex });
  }

  protected async dualPage(callback: (page: Page) => Promise<any>) {
    return await Promise.all([callback(this.tabOne), callback(this.tabTwo)]);
  }

  protected async visit(URLs: URL[]) {
    this.statusUpdate("visit", arguments);
    let urls = [].concat(URLs);
    await this.init();
    const res = this.dualPage((page) =>
      page.goto(urls.shift(), { waitUntil: "networkidle0" })
    );

    return res;
  }

  protected async setWidth(width: number) {
    this.statusUpdate("setWidth", arguments);
    await this.dualPage((page) =>
      page.setViewport({ width: width, height: 100 })
    );
  }

  protected async screenshot() {
    this.statusUpdate("screenshot", arguments);
    const [one, two] = [
      await this.tabOne.screenshot({ encoding: "base64" }),
      await this.tabTwo.screenshot({ encoding: "base64" }),
    ];
    return { one, two };
  }

  protected async compareURLs(job: Job) {
    this.statusUpdate("compareURLs", job);
    const { URLs, Viewports, InjectJS } = job;
    await this.reset();
    await this.visit(URLs);
    await this.getDomCount("body");

    if (InjectJS.enabled) {
      this.statusUpdate("Inject JS", InjectJS);
      await this.dualPage((page) => page.evaluate(InjectJS.script));
    }

    let screenshot: IncompleteScreenshot = {
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

    this.statusUpdate("comparedURL", {
      URLs,
      Viewports,
      InjectJS,
    });
    this.emit("done");
  }

  protected async getScreenshotDiff(
    Screenshots: Array<Screenshot>
  ): Promise<ScreenshotDiff> {
    this.statusUpdate("getScreenshotDiff", arguments);
    const [one, two] = Screenshots;

    const res: ResembleComparisonResult = await compare(
      Buffer.from(one.Base64, "base64"),
      Buffer.from(two.Base64, "base64")
    );

    const { isSameDimensions, misMatchPercentage } = res;
    const Base64 = res.getImageDataUrl();
    console.log(one.URL);
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
    this.statusUpdate("getDomCount", arguments);
    const [one, two] = await this.dualPage((page) => page.$$(selector));
    return [one.length, two.length];
  }
}

export type InjectJS = {
  enabled: boolean;
  script: string;
};

type ScreenshotDiff = {
  Width: number;
  Path: string;
  Base64: string | null;
  Screenshots: Array<Screenshot>;
  misMatchPercentage: number;
  isSameDimensions: boolean;
  DOMCountDiff: number;
};

type Screenshot = {
  Base64: string;
  URL: string;
  Width: number;
  DOMCount: number;
};

type IncompleteScreenshot = {
  Base64: string | null;
  URL: string | null;
  Width: number | null;
};

type Job = {
  URLs: URL[];
  Viewports: Array<number>;
  InjectJS: InjectJS;
};
