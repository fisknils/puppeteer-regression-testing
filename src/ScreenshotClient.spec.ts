import { ScreenshotClient, ScreenshotDiff } from "./ScreenshotClient";
import "fs";
import "http";
import "path";

const fs = require("fs");
const http = require("http");
const path = require("path");

const testItem = {
  URLs: [
    new URL("file:///" + path.resolve(__dirname, "../tests", "source.html")),
    new URL("file:///" + path.resolve(__dirname, "../tests", "target.html")),
  ],
  Viewports: [320],
  InjectJS: {
    enabled: false,
    script: "",
  },
};

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

let client, server;

beforeEach(() => {
  client = new ScreenshotClient();
});

beforeAll(() => {
  jest.setTimeout(10000);
});

describe("ScreenshotClient", () => {
  it("Constructs", async () => {
    expect.assertions(1);
    expect(client).toBeInstanceOf(ScreenshotClient);
  });

  it("Inits", async () => {
    expect(client.init()).resolves.toBeTruthy();
  });

  it("Compares", async () => {
    expect.assertions(2);

    const results = [];

    await client.init();

    const diff: Promise<void> = new Promise((resolve) => {
      client.onResult((res) => {
        resolve(res);
      });
    })
      .then(({ misMatchPercentage }) => {
        expect(misMatchPercentage).toEqual("0.17");
      })
      .catch(console.error);

    client.addJob(testItem);

    await diff;
  });
});
