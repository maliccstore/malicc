import { EventEmitter } from "events";

/** Topic name for live analytics updates */
export const LIVE_ANALYTICS_TOPIC = "LIVE_ANALYTICS";

const ee = new EventEmitter();

/**
 * A tiny, stable PubSub implementation to avoid dependency interop issues.
 * Works perfectly with TypeGraphQL and GraphQL subscriptions.
 */
export const pubsub = {
  /**
   * Publish a payload to a specific topic.
   */
  publish(topic: string, payload: any): void {
    ee.emit(topic, payload);
  },

  /**
   * Returns an AsyncIterator for the given topic.
   * TypeGraphQL uses this to handle the subscription stream.
   */
  asyncIterator(topic: string): AsyncIterableIterator<any> {
    const pullQueue: any[] = [];
    const pushQueue: any[] = [];
    let listening = true;

    const pushValue = (value: any) => {
      if (pullQueue.length !== 0) {
        pullQueue.shift()({ value, done: false });
      } else {
        pushQueue.push(value);
      }
    };

    const pullValue = () => {
      return new Promise((resolve) => {
        if (pushQueue.length !== 0) {
          resolve({ value: pushQueue.shift(), done: false });
        } else {
          pullQueue.push(resolve);
        }
      });
    };

    ee.on(topic, pushValue);

    return {
      next() {
        return listening ? pullValue() : Promise.resolve({ value: undefined, done: true });
      },
      return() {
        listening = false;
        ee.off(topic, pushValue);
        return Promise.resolve({ value: undefined, done: true });
      },
      throw(error: any) {
        listening = false;
        ee.off(topic, pushValue);
        return Promise.reject(error);
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    } as any;
  },
};
