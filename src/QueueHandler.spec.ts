import { QueueHandler } from "./QueueHandler";

const testItem = { text: "hello" };
let Q;

beforeEach(() => {
  Q = new QueueHandler();
});

describe("QueueHandler", () => {
  it("Adds and returns an item to/from the queue", () => {
    expect.assertions(2);

    expect(Q.enqueue(testItem)).toBeTruthy();
    expect(Q.shiftQueue()).toEqual(testItem);
  });

  it("Does not add duplicate items", () => {
    expect.assertions(1);

    Q.enqueue(testItem);
    expect(Q.enqueue(testItem)).toBeFalsy();
  });

  it("Returns null when queue is depleted", () => {
    expect.assertions(1);

    Q.enqueue(testItem);
    Q.shiftQueue();
    expect(Q.shiftQueue()).toEqual(null);
  });

  it("Initially has 0 items in the queue", () => {
    expect.assertions(3);

    expect(Q.Waiting.length).toEqual(0);
    expect(Q.Completed.length).toEqual(0);
    expect(Q.Running.length).toEqual(0);
  });

  it("Marks new item as waiting", () => {
    expect.assertions(4);

    Q.enqueue(testItem);
    expect(Q.Waiting.length).toEqual(1);
    expect(Q.Completed.length).toEqual(0);
    expect(Q.Running.length).toEqual(0);
    expect(Q.Waiting.pop().item).toEqual(testItem);
  });

  it("Marks shifted item as running", () => {
    expect.assertions(3);

    Q.enqueue(testItem);
    Q.shiftQueue();
    expect(Q.Waiting.length).toEqual(0);
    expect(Q.Running.length).toEqual(1);
    expect(Q.Completed.length).toEqual(0);
  });

  it("Marks completed item as completed", () => {
    expect.assertions(4);

    Q.enqueue(testItem);
    Q.shiftQueue();
    expect(Q.markComplete(testItem)).toBeTruthy();
    expect(Q.Waiting.length).toEqual(0);
    expect(Q.Running.length).toEqual(0);
    expect(Q.Completed.length).toEqual(1);
  });

  it("Emits 'done' when all queue items are marked as complete", async () => {
    expect.assertions(1);

    const res = new Promise((resolve, reject) => {
      setTimeout(reject, 1000);
      Q.on("done", resolve);
    })
      .then(() => true)
      .catch(() => false);

    Q.enqueue(testItem);
    Q.shiftQueue();
    Q.markComplete(testItem);

    expect(res).resolves.toBeTruthy();
  });
});
