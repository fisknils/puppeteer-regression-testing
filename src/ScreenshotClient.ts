import * as Puppeteer from "puppeteer";
import { EventEmitter } from "events";
import { promisify } from "util";
import { ResembleComparisonResult } from "resemblejs";
import { Logger } from "./Logger";
import { QueueHandler } from "./QueueHandler";

const compare = promisify( require( "resemblejs" ).compare );
const puppeteer = require( "puppeteer" );

export class ScreenshotClient extends EventEmitter
{
  public logger: Logger = new Logger();
  protected queue: QueueHandler = new QueueHandler();
  protected isReady: boolean = true;
  protected isBusy: boolean = false;
  protected isClosed: boolean = false;
  protected isWorking: boolean = false;
  protected quit: boolean = false;

  constructor ()
  {
    super();

    this.on( "add-job", ( job ) => this.addJob( job ) );
  }

  public async addJob( job: Job ): Promise<boolean>
  {
    this.logger.log( "status", "addJob", { job } );
    const res = this.queue.enqueue( job );

    if ( !this.isWorking && res )
    {
      this.tick();
    }

    return res;
  }

  public async onResult( callback: Function )
  {
    this.on( "result", ( result ) => callback( result ) );
  }

  async getWork(): Promise<boolean>
  {
    const job: Job = this.queue.shiftQueue();

    if ( !job )
    {
      return false;
    }

    this.logger.log( "status", "getWork", { job } );
    await this.startJob( job );
    return true;
  }

  protected async startJob( job: Job )
  {
    this.emit( "start-job" );
    this.logger.log( "status", "startJob", { job } );

    if ( job.URLs.length !== 2 )
    {
      throw new Error( 'Expected exactly 2 URLs, but got ' + job.URLs.length );
    }

    const browser = await Puppeteer.launch();
    await this.compareURLs( browser, job );
    await browser.close();

    this.emit( 'did-job', { job } );
  }

  protected async tick()
  {
    if ( this.isWorking )
    {
      return;
    }

    this.isWorking = true;
    const res = await this.getWork();
    this.isWorking = false;

    if ( res && !this.quit )
    {
      setTimeout( () => this.tick(), 500 );
    }
  }

  protected async visit( p1: Puppeteer.Page, p2: Puppeteer.Page, URLs: URL[] ): Promise<void>
  {
    this.logger.log( "status", "visit", { URLs } );

    if ( URLs.length !== 2 )
    {
      throw new Error( 'Expected exactly 2 URLs, but got ' + URLs.length );
    }

    const [ url1, url2 ] = URLs;

    await p1.goto( url1.toString(), { waitUntil: "networkidle0" } );
    await p2.goto( url2.toString(), { waitUntil: "networkidle0" } );
  }

  protected async setWidth( p1: Puppeteer.Page, p2: Puppeteer.Page, width: number ): Promise<void>
  {
    this.logger.log( "status", "setWidth", { width } );
    const viewport = {
      width: width,
      height: 100
    };

    await p1.setViewport( viewport );
    await p2.setViewport( viewport );
  }

  protected async screenshot( p1: Puppeteer.Page, p2: Puppeteer.Page, selector: string = "body" ): Promise<any>
  {
    this.logger.log( "status", "screenshot" );

    const el1 = await p1.$( selector );
    const el2 = await p2.$( selector );

    const screenshot1 = await p1.screenshot( { encoding: "base64", fullPage: true } );
    const screenshot2 = await p2.screenshot( { encoding: 'base64', fullPage: true } );

    return { screenshot1, screenshot2 };
  }

  protected async InjectJS( p1: Puppeteer.Page, p2: Puppeteer.Page, script: string ): Promise<void>
  {
    await p1.evaluate( ( script ) => eval( script ), script );
    await p2.evaluate( ( script ) => eval( script ), script );
  }

  protected async getDomCount( p1: Puppeteer.Page, p2: Puppeteer.Page, selector: string = "*" ): Promise<number[]>
  {
    this.logger.log( "status", "getDomCount", [] );

    const one = await p1.$$( selector );
    const two = await p2.$$( selector );

    return [ one.length, two.length ];
  }

  protected async compareURLs( browser: Puppeteer.Browser, job: Job ): Promise<void>
  {
    const { URLs, Viewports, InjectJS } = Object.assign( {}, job );
    const [ urlOne, urlTwo ] = URLs;

    let screenshot: IncompleteScreenshot = {
      Base64: null,
      URL: null,
      Width: null,
    };

    this.logger.log( "status", "compareURLs", { job } );

    const p1 = await browser.newPage();
    const p2 = await browser.newPage();

    await this.visit( p1, p2, URLs );

    // Maybe inject JS
    if ( InjectJS.enabled ) await this.InjectJS( p1, p2, InjectJS.script );

    for ( let vi in Viewports )
    {
      // Set Viewport
      screenshot.Width = Viewports[ vi ];
      await this.setWidth( p1, p2, screenshot.Width );

      // Take screenshots
      const { screenshot1, screenshot2 } = await this.screenshot( p1, p2 );

      // Count DOM Elements
      const [ count1, count2 ] = await this.getDomCount( p1, p2 );

      // Calculate Diff
      const diff: ScreenshotDiff = await this.getScreenshotDiff( [
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
      ] );

      diff.Base64 = diff.Base64.replace( /^data:image\/png;base64,/, "" );

      this.emit( "result", diff );
    }

    this.logger.log( "status", "comparedURL", {
      URLs,
      Viewports,
      InjectJS,
    } );

    this.emit( "ready" );
  }

  protected async getScreenshotDiff(
    Screenshots: Screenshot[]
  ): Promise<ScreenshotDiff>
  {
    this.logger.log( "status", "getScreenshotDiff", [] );
    const [ one, two ] = Screenshots;

    const res: ResembleComparisonResult = await compare(
      Buffer.from( one.Base64, "base64" ),
      Buffer.from( two.Base64, "base64" )
    );

    const { isSameDimensions, misMatchPercentage } = res;
    const Base64 = res.getImageDataUrl();
    const { pathname } = new URL( one.URL );
    const [ countOne, countTwo ] = [ one.DOMCount, two.DOMCount ];
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
}

export type InjectJS = {
  enabled: boolean;
  script: string;
};

export type ScreenshotDiff = {
  Width: number;
  Path: string;
  Base64: string;
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
