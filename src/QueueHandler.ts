import { EventEmitter } from "events";

const where = (array: Array<any>, where: PartialQueued, limit: number = 0) => {
  const results: Array<any> = array.filter((item) => {
    const _queued = JSON.stringify(item);
    const _comparison = JSON.stringify(Object.assign({}, item, where));
    return _queued === _comparison;
  });
  if (!limit) {
    return results;
  }
  return results.splice(0, limit);
};

export class QueueHandler extends EventEmitter {
  protected queue: Queue = [];

  /**
   * Checks if an item already is in the queue, processed or not.
   *
   * @param item An item of any type to look for within Queue.
   */
  protected hasItem(item: any): boolean {
    return !!where(this.queue, { item }).length;
  }

  /**
   * Updates a queued item's properties.
   *
   * @param item A queued item
   * @param modified The properties to update
   */
  protected update(item: Queued, modified: PartialQueued): boolean {
    const i = this.queue.indexOf(item);
    const queueItem = this.queue[i];
    if (queueItem === Object.assign({}, queueItem, modified)) {
      return false;
    }
    this.queue[i] = Object.assign({}, item, modified);
    return true;
  }

  /**
   *
   * @param item An item of any type to queue.
   */
  enqueue(item: any): boolean {
    if (this.hasItem(item)) {
      return false;
    }

    this.queue.push({
      item: item,
      enqueued: +new Date(),
      status: "waiting",
    });
    return true;
  }

  /**
   * @return An item from the queue.
   */
  shiftQueue(): any {
    const matches = where(this.queue, { status: "waiting" }, 1);
    if (!matches.length) {
      return null;
    }

    const match = matches.pop();
    this.update(match, { status: "running" });
    return match.item;
  }

  markComplete(item: any): boolean {
    const matches = where(this.queue, { item: item }, 1);
    if (!matches.length) return false;

    const match = matches.pop();
    const res = this.update(match, { status: "done" });

    if (!this.Running.length && !this.Waiting.length) {
      this.emit("done");
    }

    return res;
  }

  get Completed(): Queued[] {
    return where(this.queue, { status: "done" });
  }

  get Running(): Queued[] {
    return where(this.queue, { status: "running" });
  }

  get Waiting(): Queued[] {
    return where(this.queue, { status: "waiting" });
  }
}

export type Queue = Queued[];

type QueueStatus = "waiting" | "running" | "done";

export type Queued = {
  item: any;
  enqueued: number;
  status: QueueStatus;
};

export type PartialQueued = {
  item?: any;
  enqueued?: number;
  status?: QueueStatus;
};
