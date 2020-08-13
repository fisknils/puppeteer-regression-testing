/// <reference types="node" />
import { EventEmitter } from "events";
export declare class QueueHandler extends EventEmitter {
    private queue;
    /**
     * Emits a notice
     *
     * @param method The calling method's name.
     * @param message A string message.
     * @param params Arguments of the calling method.
     */
    private notice;
    /**
     * Checks if an item already is in the queue, processed or not.
     *
     * @param item An item of any type to look for within Queue.
     */
    private hasItem;
    /**
     * Updates a queued item's properties.
     *
     * @param item A queued item
     * @param modified The properties to update
     */
    private update;
    /**
     * Constructs a proper Queue item
     *
     * @param item An item of any type to queue
     */
    private QItem;
    /**
     *
     * @param item An item of any type to queue.
     */
    enqueue(item: any): void;
    /**
     * @return An item from the queue.
     */
    shiftQueue(): any;
}
export declare type Queue = Queued[];
export declare type Queued = {
    item: any;
    enqueued: number;
    status: "waiting" | "running" | "done" | "error";
};
export declare type PartialQueued = {
    item?: any;
    enqueued?: number;
    status?: "waiting" | "running" | "done" | "error";
};
export declare type QueueHandlerNotice = {
    method: string;
    message: string;
    params: IArguments;
};
