import { Browser, Page, ElementHandle } from "puppeteer";
import { EventEmitter } from "events";
import { promisify } from "util";
import { ResembleComparisonResult } from "resemblejs";
import { Logger } from "./Logger";
import { QueueHandler } from "./QueueHandler";

const stringify = require("json-stringify-safe");
const compare = promisify(require("resemblejs").compare);
const puppeteer = require("puppeteer");

export class ScreenshotClient extends EventEmitter {
  protected logger: Logger = new Logger();
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

    this.once("ready", () => this.tick());
    this.on("tick", this.getWork);
    this.on("add-job", this.addJob);
    this.on("start-job", () => (this.isBusy = true));
    this.on("did-job", () => (this.isBusy = false));
    this.init();
  }

  protected async init() {
    this.logger.status("init", []);

    try {
      this.browser = await puppeteer.launch();
      this.tabOne = await this.browser.newPage();
      this.tabTwo = await this.browser.newPage();
      this.isClosed = false;
    } catch (e) {
      this.logger.error("init", e);
    } finally {
      this.emit("did-init");
      this.ready();
    }
  }

  async addJob(job: Job) {
    this.logger.status("addJob", { job });
    this.queue.enqueue(job);
  }

  protected async getWork() {
    if (this.isBusy || !this.isReady) {
      return;
    }

    const job: Job = this.queue.shiftQueue();

    if (job) {
      this.statusUpdate("getWork", arguments);
      await this.startJob(job);
      return;
    }
    this.statusUpdate("idle", arguments);
  }

  protected async startJob(job: Job) {
    await this.reset();
    this.emit("start-job");
    this.statusUpdate("startJob", arguments);
    console.log(job);
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

  protected async statusUpdate(method: string, args: any): Promise<void> {
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
    const res = this.dualPage((page) =>
      page.goto(urls.shift(), { waitUntil: "networkidle0", timeout: 0 })
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
    this.statusUpdate("compareURLs", job);
    const { URLs, Viewports, InjectJS } = job;
    await this.reset();
    await this.visit(URLs);
    await this.getDomCount("body");

    if (InjectJS.enabled) {
      this.statusUpdate("Inject JS", InjectJS);
      await this.dualPage((page) =>
        page.evaluate((InjectJS) => eval(InjectJS.script), InjectJS)
      );
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

export type ScreenshotDiff = {
  Width: number;
  Path: string;
  Base64: string | null;
  Screenshots: Array<Screenshot>;
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
  Viewports: Array<number>;
  InjectJS: InjectJS;
};
