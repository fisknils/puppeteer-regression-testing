"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scraper = void 0;
var puppeteer = require("puppeteer");
var events_1 = require("events");
var util_1 = require("util");
var Logger_1 = require("./Logger");
var QueueHandler_1 = require("./QueueHandler");
var compare = util_1.promisify(require("resemblejs").compare);
var Scraper = /** @class */ (function (_super) {
    __extends(Scraper, _super);
    function Scraper() {
        var _this = _super.call(this) || this;
        _this.logger = new Logger_1.Logger("Scraper");
        _this.queue = new QueueHandler_1.QueueHandler();
        _this.isReady = true;
        _this.isBusy = false;
        _this.isClosed = false;
        _this._tick = "tock";
        _this.on("done", _this.startQuitTimeout);
        _this.on("compare-urls", _this.stopQuitTimeout);
        _this.on("add-job", _this.addJob);
        _this.on("start-job", function () { return (_this.isBusy = true); });
        _this.on("did-job", function () { return (_this.isBusy = false); });
        _this.once("ready", function () { return _this.tick(); });
        _this.on("tick", console.log);
        _this.init();
        return _this;
    }
    Scraper.prototype.addJob = function (job) {
        this.queue.enqueue(job);
    };
    Scraper.prototype.getWork = function () {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        job = this.queue.shiftQueue();
                        if (!job) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.startJob(job)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    Scraper.prototype.startJob = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.emit("start-job", job);
                        return [4 /*yield*/, this.reset()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.compareURLs(job)
                                .then(function () { return _this.emit("did-job", { job: job }); })
                                .catch(function (e) { return _this.emit("error", { method: "startJob", data: e }); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Scraper.prototype.startQuitTimeout = function () {
        var _this = this;
        var seconds = 5;
        this.quitTimeout = setTimeout(function () {
            _this.emit("status", "No action in 5 seconds. I think I'm done.");
            _this.close();
        }, seconds * 1000);
    };
    Scraper.prototype.stopQuitTimeout = function () {
        clearTimeout(this.quitTimeout);
    };
    Scraper.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, e_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.emit("status", "initializing");
                        this.emit("start-init");
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 5, 6, 7]);
                        _a = this;
                        return [4 /*yield*/, puppeteer.launch()];
                    case 2:
                        _a.browser = _d.sent();
                        _b = this;
                        return [4 /*yield*/, this.browser.newPage()];
                    case 3:
                        _b.tabOne = _d.sent();
                        _c = this;
                        return [4 /*yield*/, this.browser.newPage()];
                    case 4:
                        _c.tabTwo = _d.sent();
                        this.isClosed = false;
                        return [3 /*break*/, 7];
                    case 5:
                        e_1 = _d.sent();
                        this.emit("error", { method: "init", data: e_1 });
                        this.startQuitTimeout();
                        return [3 /*break*/, 7];
                    case 6:
                        this.emit("did-init");
                        this.ready();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Scraper.prototype.tick = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._tick = this._tick === "tick" ? "tock" : "tick";
                        this.emit("tick", this._tick);
                        if (this.isBusy || !this.isReady) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.getWork()];
                    case 1:
                        _a.sent();
                        if (!this.isClosed) {
                            setTimeout(function () { return _this.tick(); }, 1000);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Scraper.prototype.ready = function () {
        this.emit("status", "ready");
        this.emit("ready");
        this.isReady = true;
    };
    Scraper.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.emit("start-close");
                if (this.browser)
                    this.browser.close();
                this.isClosed = true;
                return [2 /*return*/];
            });
        });
    };
    Scraper.prototype.reset = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.emit("start-reset");
                        this.close();
                        return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        this.emit("did-reset");
                        return [2 /*return*/];
                }
            });
        });
    };
    Scraper.prototype.statusUpdate = function (method, args) {
        this.emit("status", { method: method, args: args });
    };
    Scraper.prototype.onError = function (method, ex) {
        this.emit("error", { method: method, ex: ex });
    };
    Scraper.prototype.dualPage = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([callback(this.tabOne), callback(this.tabTwo)])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Scraper.prototype.visit = function (URLs) {
        return __awaiter(this, void 0, void 0, function () {
            var urls, res;
            return __generator(this, function (_a) {
                this.emit("start-visit", URLs);
                this.statusUpdate("visit", URLs);
                urls = [].concat(URLs);
                res = this.dualPage(function (page) { return page.goto(urls.shift()); });
                this.emit("did-visit", URLs);
                return [2 /*return*/, res];
            });
        });
    };
    Scraper.prototype.setWidth = function (width) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.emit("start-set-width", width);
                        this.statusUpdate("setWidth", { width: width });
                        return [4 /*yield*/, this.dualPage(function (page) {
                                return page.setViewport({ width: width, height: 100 });
                            })];
                    case 1:
                        _a.sent();
                        this.emit("did-set-width", width);
                        return [2 /*return*/];
                }
            });
        });
    };
    Scraper.prototype.screenshot = function (selector) {
        if (selector === void 0) { selector = "body"; }
        return __awaiter(this, void 0, void 0, function () {
            var elements, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.statusUpdate("screenshot", { selector: selector });
                        return [4 /*yield*/, this.dualPage(function (page) { return page.$(selector); })];
                    case 1:
                        elements = _b.sent();
                        _a = {};
                        return [4 /*yield*/, elements.shift().screenshot({ encoding: "base64" })];
                    case 2:
                        _a.one = _b.sent();
                        return [4 /*yield*/, elements.shift().screenshot({ encoding: "base64" })];
                    case 3: return [2 /*return*/, (_a.two = _b.sent(),
                            _a)];
                }
            });
        });
    };
    Scraper.prototype.compareURLs = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var URLs, Viewports, Selectors, InjectJS, screenshot, _a, _b, _i, vi, _c, _d, _e, si, _f, one, two, urlOne, urlTwo;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        URLs = job.URLs, Viewports = job.Viewports, Selectors = job.Selectors, InjectJS = job.InjectJS;
                        this.emit("compare-urls", { URLs: URLs, Viewports: Viewports, Selectors: Selectors, InjectJS: InjectJS });
                        this.statusUpdate("compareURL", {
                            URLs: URLs,
                            Viewports: Viewports,
                            Selectors: Selectors,
                            InjectJS: InjectJS,
                        });
                        return [4 /*yield*/, this.visit(URLs)];
                    case 1:
                        _g.sent();
                        if (!InjectJS.enabled) return [3 /*break*/, 3];
                        this.statusUpdate("Inject JS", InjectJS);
                        return [4 /*yield*/, this.dualPage(function (page) { return page.evaluate(InjectJS.script); })];
                    case 2:
                        _g.sent();
                        _g.label = 3;
                    case 3:
                        screenshot = {
                            Base64: null,
                            URL: null,
                            Selector: null,
                            Width: null,
                        };
                        _a = [];
                        for (_b in Viewports)
                            _a.push(_b);
                        _i = 0;
                        _g.label = 4;
                    case 4:
                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                        vi = _a[_i];
                        screenshot.Width = Viewports[vi];
                        return [4 /*yield*/, this.setWidth(screenshot.Width)];
                    case 5:
                        _g.sent();
                        _c = [];
                        for (_d in Selectors)
                            _c.push(_d);
                        _e = 0;
                        _g.label = 6;
                    case 6:
                        if (!(_e < _c.length)) return [3 /*break*/, 10];
                        si = _c[_e];
                        screenshot.Selector = Selectors[si];
                        return [4 /*yield*/, this.screenshot(screenshot.Selector)];
                    case 7:
                        _f = _g.sent(), one = _f.one, two = _f.two;
                        urlOne = URLs[0], urlTwo = URLs[1];
                        return [4 /*yield*/, this.getScreenshotDiff([
                                Object.assign({}, screenshot, {
                                    URL: urlOne,
                                    Base64: one,
                                }),
                                Object.assign({}, screenshot, {
                                    URL: urlTwo,
                                    Base64: two,
                                }),
                            ])];
                    case 8:
                        _g.sent();
                        _g.label = 9;
                    case 9:
                        _e++;
                        return [3 /*break*/, 6];
                    case 10:
                        _i++;
                        return [3 /*break*/, 4];
                    case 11:
                        this.statusUpdate("comparedURL", {
                            URLs: URLs,
                            Viewports: Viewports,
                            Selectors: Selectors,
                            InjectJS: InjectJS,
                        });
                        this.emit("done");
                        return [2 /*return*/];
                }
            });
        });
    };
    Scraper.prototype.getScreenshotDiff = function (Screenshots) {
        return __awaiter(this, void 0, void 0, function () {
            var one, two, res, isSameDimensions, misMatchPercentage, Base64, _a, Selector, URL, Width, pathname, ScreenshotDiff;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        one = Screenshots[0], two = Screenshots[1];
                        return [4 /*yield*/, compare(Buffer.from(one.Base64, "base64"), Buffer.from(two.Base64, "base64"))];
                    case 1:
                        res = _b.sent();
                        isSameDimensions = res.isSameDimensions, misMatchPercentage = res.misMatchPercentage;
                        Base64 = res.getImageDataUrl();
                        _a = Screenshots[0], Selector = _a.Selector, URL = _a.URL, Width = _a.Width;
                        pathname = URL.pathname;
                        ScreenshotDiff = {
                            Selector: Selector,
                            Width: Width,
                            Path: pathname,
                            Base64: Base64,
                            Screenshots: Screenshots,
                            isSameDimensions: isSameDimensions,
                            misMatchPercentage: misMatchPercentage,
                        };
                        this.emit("result", ScreenshotDiff);
                        return [2 /*return*/, ScreenshotDiff];
                }
            });
        });
    };
    return Scraper;
}(events_1.EventEmitter));
exports.Scraper = Scraper;
//# sourceMappingURL=Scraper.js.map