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
const args2 = Object.assign({}, args, {
    URLs: [
        new URL("http://absolutart.com.dev.synot.io/cn"),
        new URL("https://www.absolutart.com/cn"),
    ],
});
(async () => {
    const bot = new Scraper_1.Scraper();
    bot.on("result", (result) => console.log(result.Path));
    bot.on("status", console.log);
    bot.once("ready", () => {
        bot.addJob(args);
        bot.addJob(args2);
    });
})();
