import { Scraper, InjectJS } from "./Scraper";

type test_arguments = {
  URLs: URL[];
  Viewports: number[];
  Selectors: string[];
  InjectJS: InjectJS;
};

const args: test_arguments = {
  URLs: [
    new URL("http://absolutart.com.dev.synot.io/se"),
    new URL("https://www.absolutart.com/se"),
  ],
  Viewports: [360, 720],
  Selectors: ["body"],
  InjectJS: {
    enabled: false,
    script: "",
  },
};

(async () => {
  const bot = new Scraper();
  bot.on("status", console.log);
  bot.on("result", (args) => {
    let { Screenshots, isSameDimensions, misMatchPercentage } = args;
    args.Screenshots = args.Screenshots.map((screenshot: any) => {
      screenshot.Base64 = screenshot.Base64.length;
      return screenshot;
    });
    args.Base64 = args.Base64.length;
    console.log(args);
  });
  bot.once("ready", () => {
    bot.addJob(args);
  });
})();
