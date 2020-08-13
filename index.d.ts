declare module "puppeteer-regression-testing" {
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
}
