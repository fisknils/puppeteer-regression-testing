declare module "puppeteer-regression-testing" {
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
}
