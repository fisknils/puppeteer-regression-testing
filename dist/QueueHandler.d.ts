/// <reference types="node" />
import { EventEmitter } from "events";
export declare class QueueHandler extends EventEmitter {
    protected queue: Queue;
    /**
     * Checks if an item already is in the queue, processed or not.
     *
     * @param item An item of any type to look for within Queue.
     */
    protected hasItem(item: any): boolean;
    /**
     * Updates a queued item's properties.
     *
     * @param item A queued item
     * @param modified The properties to update
     */
    protected update(item: Queued, modified: PartialQueued): boolean;
    /**
     *
     * @param item An item of any type to queue.
     */
    enqueue(item: any): boolean;
    /**
     * @return An item from the queue.
     */
    shiftQueue(): any;
    markComplete(item: any): boolean;
    get Completed(): Queued[];
    get Running(): Queued[];
    get Waiting(): Queued[];
}
export declare type Queue = Queued[];
declare type QueueStatus = "waiting" | "running" | "done";
export declare type Queued = {
    item: any;
    enqueued: number;
    status: QueueStatus;
};
export declare type PartialQueued = {
    item?: any;
    enqueued?: number;
    status?: QueueStatus;
};
export {};
//# sourceMappingURL=QueueHandler.d.ts.map