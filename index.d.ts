declare module "puppeteer-regression-testing" {
  type InjectJS = {
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

  type Job = {
    URLs: URL[];
    Viewports: Array<number>;
    InjectJS: InjectJS;
  };
}
