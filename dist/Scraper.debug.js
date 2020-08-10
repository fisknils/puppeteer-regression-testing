"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scraper = void 0;
const Scraper_1 = require("./Scraper");
Object.defineProperty(exports, "Scraper", { enumerable: true, get: function () { return Scraper_1.Scraper; } });
Object.getOwnPropertyNames(Scraper_1.Scraper.prototype).forEach(name => {
    Scraper_1.Scraper.prototype["_" + name] = Scraper_1.Scraper.prototype[name];
    Scraper_1.Scraper.prototype[name] = function () {
        console.log(`Method call: ${name}(${Object.values(arguments).join(", ")})`);
        const result = this["_" + name](...arguments);
        if (result instanceof Promise) {
            (async () => {
                const resolved = await result;
                console.log(`${name} result: ${resolved}`);
            })();
        }
        else {
            console.log(`${name} result: ${result}`);
        }
        return result;
    };
});
//# sourceMappingURL=Scraper.debug.js.map