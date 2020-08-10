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
  bot.on("dom-count", console.log);
  bot.on("result", console.log);
  bot.once("ready", () => {
    bot.addJob(args);
  });
})();
