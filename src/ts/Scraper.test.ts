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

const args2 = Object.assign({}, args, {
  URLs: [
    new URL("http://absolutart.com.dev.synot.io/cn"),
    new URL("https://www.absolutart.com/cn"),
  ],
});

(async () => {
  const bot = new Scraper();
  bot.on("result", (result) => console.log(result.Path));
  bot.on("status", console.log);
  bot.once("ready", () => {
    bot.addJob(args);
    bot.addJob(args2);
  });
})();
