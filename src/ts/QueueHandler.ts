import { EventEmitter } from "events";

type Queue = Queued[];

type Queued = {
  item: any;
  enqueued: number;
  status: "waiting" | "running" | "done" | "error";
};

type PartialQueued = {
  item?: any;
  enqueued?: number;
  status?: "waiting" | "running" | "done" | "error";
};

type QueueHandlerNotice = {
  method: string;
  message: string;
  params: IArguments;
};

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
  private queue: Queue = [];

  /**
   * Emits a notice
   *
   * @param method The calling method's name.
   * @param message A string message.
   * @param params Arguments of the calling method.
   */
  private notice(method: string, message: string, params: IArguments): void {
    const notice: QueueHandlerNotice = { method, message, params };
    this.emit("notice", notice);
  }

  /**
   * Checks if an item already is in the queue, processed or not.
   *
   * @param item An item of any type to look for within Queue.
   */
  private hasItem(item: any): boolean {
    return !!where(this.queue, { item }).length;
  }

  /**
   * Updates a queued item's properties.
   *
   * @param item A queued item
   * @param modified The properties to update
   */
  private update(item: Queued, modified: PartialQueued): void {
    const i = this.queue.indexOf(item);
    this.queue[i] = Object.assign({}, item, modified);
    this.notice("update", "Updated state of queued item", arguments);
  }

  /**
   * Constructs a proper Queue item
   *
   * @param item An item of any type to queue
   */
  private QItem(item: any): Queued {
    if (this.hasItem(item)) {
      this.emit("notice", "QItem", "Item already exists in queue", arguments);
      return;
    }

    this.queue.push({
      item: item,
      enqueued: +new Date(),
      status: "waiting",
    });

    this.notice("QItem", "Item was added to queue", arguments);
  }

  /**
   *
   * @param item An item of any type to queue.
   */
  enqueue(item: any): void {
    this.notice("enqueue", "Attempting to add item to queue", arguments);
    this.QItem(item);
  }

  /**
   * @return An item from the queue.
   */
  shiftQueue(): any {
    this.notice("shiftQueue", "shiftQueue called", arguments);
    const matches = where(this.queue, { status: "waiting" }, 1);
    if (!matches.length) {
      this.notice("shiftQueue", "No unhandled items in queue", arguments);
      return null;
    }

    const match = matches.pop();
    this.update(match, { status: "running" });
    return match.item;
  }
}
