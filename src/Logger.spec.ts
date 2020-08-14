import "./Logger";
import { Logger, LogType, LogMessage } from "./Logger";

const args = {
  label: "test-status",
  data: { hello: "world" },
};

const circular = {
  label: "test-circular",
  data: {},
};
circular.data = circular;

async function emitTest(type: LogType, extra_args = {}) {
  expect.assertions(1);

  const _args = Object.assign({}, args, extra_args);

  const log = new Logger();

  await expect(
    new Promise((res, rej) => {
      setTimeout(() => rej(), 1000);
      log.on("status", res);
      log.log("status", _args.label, _args.data);
    })
  ).resolves.toEqual(_args);
}

it("emits info messages", () => emitTest("info"));
it("emits status messages", () => emitTest("status"));
it("emits notice messages", () => emitTest("notice"));
it("emits warning messages", () => emitTest("warning"));
it("emits error messages", () => emitTest("error"));
