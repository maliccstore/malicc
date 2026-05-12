import { Event } from "../../models/Event";
import { EventSyncStatus } from "../../enums/Events"
import { getRetryDelay, MAX_RETRIES } from "../utils/retry-strategy";
import { Op } from "sequelize";

export class EventDispatcherService {
  private static isCircuitOpen = false;
  private static consecutiveFailures = 0;
  private static readonly CIRCUIT_THRESHOLD = 5;
  private static readonly CIRCUIT_RESET_TIME = 5 * 60 * 1000; // 5 minutes

  /**
   * Processes a batch of pending events and dispatches them to HQ.
   */
  static async processPendingEvents(): Promise<void> {
    if (this.isCircuitOpen) {
      console.log("[EventDispatcher] Circuit is OPEN. Skipping dispatch.");
      return;
    }

    const events = await Event.findAll({
      where: {
        sync_status: {
          [Op.in]: [EventSyncStatus.PENDING, EventSyncStatus.FAILED],
        },
        retry_count: {
          [Op.lt]: MAX_RETRIES,
        },
      },
      limit: 50,
      order: [["created_at", "ASC"]],
    });

    if (events.length === 0) return;

    console.log(`[EventDispatcher] Found ${events.length} events to dispatch.`);

    for (const event of events) {
      await this.dispatchEvent(event);
    }
  }

  /**
   * Dispatches a single event via Webhook.
   */
  private static async dispatchEvent(event: Event): Promise<void> {
    const endpoint = process.env.HQ_EVENT_ENDPOINT;
    const secret = process.env.EVENT_BRIDGE_SECRET;

    if (!endpoint || !secret) {
      console.error("[EventDispatcher] Missing HQ_EVENT_ENDPOINT or EVENT_BRIDGE_SECRET in environment.");
      return;
    }

    try {
      // Mark as DISPATCHING to avoid double processing
      await event.update({ sync_status: EventSyncStatus.DISPATCHING });

      const outgoingPayload = {
        eventId: event.id,
        eventType: event.event,
        storeId: event.store_id,
        timestamp: event.created_at.toISOString(),
        payload: event.payload,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Event-Secret": secret,
        },
        body: JSON.stringify(outgoingPayload),
      });


      if (response.ok) {
        await event.update({
          sync_status: EventSyncStatus.COMPLETED,
          last_error: null,
        });
        this.resetCircuit();
        console.log(`[EventDispatcher] [${event.store_id}] [${event.id}] Dispatched successfully.`);
      } else {
        const errorText = await response.text();
        throw new Error(`HQ returned ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      this.handleFailure();

      const nextRetryDelay = getRetryDelay(event.retry_count);
      const isPermanentFailure = nextRetryDelay === -1 || error.message.includes("400");

      await event.update({
        sync_status: isPermanentFailure ? EventSyncStatus.FAILED : EventSyncStatus.PENDING,
        retry_count: event.retry_count + 1,
        last_error: error.message,
      });

      console.error(`[EventDispatcher] [${event.store_id}] [${event.id}] Dispatch failed: ${error.message}`);
    }
  }

  private static handleFailure() {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.CIRCUIT_THRESHOLD) {
      this.isCircuitOpen = true;
      console.warn(`[EventDispatcher] Circuit BREAKER OPENED after ${this.consecutiveFailures} failures.`);
      setTimeout(() => this.resetCircuit(), this.CIRCUIT_RESET_TIME);
    }
  }

  private static resetCircuit() {
    this.isCircuitOpen = false;
    this.consecutiveFailures = 0;
  }
}
