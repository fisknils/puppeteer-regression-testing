"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Scraper_1 = require("./Scraper");
const args = {
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
    const bot = new Scraper_1.Scraper();
    bot.on("dom-count", console.log);
    bot.on("result", console.log);
    bot.once("ready", () => {
        bot.addJob(args);
    });
})();
//# sourceMappingURL=Scraper.test.js.map