const puppeteer = require("puppeteer");
import { Browser, Page } from "puppeteer";
import { EventEmitter } from "events";
import { promisify } from "util";
import { ResembleComparisonResult } from "resemblejs";
import { Logger } from "./Logger";
import { QueueHandler } from "./QueueHandler";

const compare = promisify(require("resemblejs").compare);

export class Scraper extends EventEmitter {
  private logger: Logger = new Logger("Scraper");
  private queue: QueueHandler = new QueueHandler();
  private browser: Browser;
  private tabOne: Page;
  private tabTwo: Page;
  private quitTimeout: any;
  private isReady: boolean = true;
  private isBusy: boolean = false;
  private isClosed: boolean = false;
  private _tick = "tock";

  constructor() {
    super();
    this.on("done", this.startQuitTimeout);
    this.on("compare-urls", this.stopQuitTimeout);
    this.on("add-job", this.addJob);
    this.on("start-job", () => (this.isBusy = true));
    this.on("did-job", () => (this.isBusy = false));
    this.once("ready", () => this.tick());

    this.on("tick", console.log);
    this.init();
  }

  addJob(job: Job) {
    this.queue.enqueue(job);
  }

  private async getWork() {
    const job: Job = this.queue.shiftQueue();
    if (job) {
      await this.startJob(job);
    }
  }

  private async startJob(job: Job) {
    this.emit("start-job", job);
    await this.reset();
    await this.compareURLs(job)
      .then(() => this.emit("did-job", { job }))
      .catch((e) => this.emit("error", { method: "startJob", data: e }));
  }

  private startQuitTimeout() {
    const seconds = 5;
    this.quitTimeout = setTimeout(() => {
      this.emit("status", "No action in 5 seconds. I think I'm done.");
      this.close();
    }, seconds * 1000);
  }

  private stopQuitTimeout() {
    clearTimeout(this.quitTimeout);
  }

  private async init() {
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

  private async tick() {
    this._tick = this._tick === "tick" ? "tock" : "tick";
    this.emit("tick", this._tick);
    if (this.isBusy || !this.isReady) {
      return;
    }
    await this.getWork();
    if (!this.isClosed) {
      setTimeout(() => this.tick(), 1000);
    }
  }

  private ready() {
    this.emit("status", "ready");
    this.emit("ready");
    this.isReady = true;
  }

  async close() {
    this.emit("start-close");
    if (this.browser) this.browser.close();
    this.isClosed = true;
  }

  async reset() {
    this.emit("start-reset");
    this.close();
    await this.init();
    this.emit("did-reset");
  }

  private statusUpdate(method: string, args: any) {
    this.emit("status", { method, args });
  }

  private onError(method: string, ex: Error) {
    this.emit("error", { method, ex });
  }

  private async dualPage(callback: (page: Page) => Promise<any>) {
    return await Promise.all([callback(this.tabOne), callback(this.tabTwo)]);
  }

  private async visit(URLs: URL[]) {
    this.emit("start-visit", URLs);

    this.statusUpdate("visit", URLs);
    let urls = [].concat(URLs);

    const res = this.dualPage((page) => page.goto(urls.shift()));

    this.emit("did-visit", URLs);
    return res;
  }

  private async setWidth(width: number) {
    this.emit("start-set-width", width);
    this.statusUpdate("setWidth", { width });
    await this.dualPage((page) =>
      page.setViewport({ width: width, height: 100 })
    );
    this.emit("did-set-width", width);
  }

  private async screenshot(selector: string = "body") {
    this.statusUpdate("screenshot", { selector });
    const elements = await this.dualPage((page) => page.$(selector));

    return {
      one: await elements.shift().screenshot({ encoding: "base64" }),
      two: await elements.shift().screenshot({ encoding: "base64" }),
    };
  }

  private async compareURLs(job: Job) {
    const { URLs, Viewports, Selectors, InjectJS } = job;
    this.emit("compare-urls", { URLs, Viewports, Selectors, InjectJS });
    this.statusUpdate("compareURL", {
      URLs,
      Viewports,
      Selectors,
      InjectJS,
    });

    await this.visit(URLs);

    if (InjectJS.enabled) {
      this.statusUpdate("Inject JS", InjectJS);
      await this.dualPage((page) => page.evaluate(InjectJS.script));
    }

    let screenshot: IncompleteScreenshot = {
      Base64: null,
      URL: null,
      Selector: null,
      Width: null,
    };

    for (let vi in Viewports) {
      screenshot.Width = Viewports[vi];
      await this.setWidth(screenshot.Width);

      for (let si in Selectors) {
        screenshot.Selector = Selectors[si];
        const { one, two } = await this.screenshot(screenshot.Selector);
        const [urlOne, urlTwo] = URLs;

        await this.getScreenshotDiff([
          Object.assign({}, screenshot, {
            URL: urlOne,
            Base64: one,
          }),
          Object.assign({}, screenshot, {
            URL: urlTwo,
            Base64: two,
          }),
        ]);
      }
    }

    this.statusUpdate("comparedURL", {
      URLs,
      Viewports,
      Selectors,
      InjectJS,
    });
    this.emit("done");
  }

  private async getScreenshotDiff(
    Screenshots: Array<Screenshot>
  ): Promise<ScreenshotDiff> {
    const [one, two] = Screenshots;

    const res: ResembleComparisonResult = await compare(
      Buffer.from(one.Base64, "base64"),
      Buffer.from(two.Base64, "base64")
    );

    const { isSameDimensions, misMatchPercentage } = res;
    const Base64 = res.getImageDataUrl();
    const { Selector, URL, Width } = Screenshots[0];
    const { pathname } = URL;

    const ScreenshotDiff: ScreenshotDiff = {
      Selector,
      Width,
      Path: pathname,
      Base64,
      Screenshots,
      isSameDimensions,
      misMatchPercentage,
    };

    this.emit("result", ScreenshotDiff);

    return ScreenshotDiff;
  }
}

export type InjectJS = {
  enabled: boolean;
  script: string;
};

type ScreenshotDiff = {
  Selector: string;
  Width: number;
  Path: string;
  Base64: string | null;
  Screenshots: Array<Screenshot>;
  misMatchPercentage: number;
  isSameDimensions: boolean;
};

type Screenshot = {
  Base64: string;
  URL: URL;
  Selector: string;
  Width: number;
};

type IncompleteScreenshot = {
  Base64: string | null;
  URL: URL | null;
  Selector: string | null;
  Width: number | null;
};

type Job = {
  URLs: URL[];
  Viewports: Array<number>;
  Selectors: Array<string>;
  InjectJS: InjectJS;
};
