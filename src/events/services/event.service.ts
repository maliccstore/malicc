import { Event } from "../../models/Event";
import { EventSyncStatus } from "../../enums/Events";
import { EmitEventOptions } from "../types/event.types";

export class EventService {
  /**
   * Emits an event by persisting it to the local Outbox table.
   * This should ideally be called within a database transaction.
   */
  static async emit(options: EmitEventOptions): Promise<Event> {
    const {
      eventType,
      payload,
      storeId,
      userId,
      sessionId,
      metadata = {},
      transaction,
    } = options;

    const event = await Event.create(
      {
        event: eventType,
        store_id: storeId,
        user_id: userId,
        session_id: sessionId,
        payload: {
          ...payload,
          _metadata: {
            ...metadata,
            version: "1.0",
            source: "malicc-backend",
          }
        },
        sync_status: EventSyncStatus.PENDING,
        retry_count: 0,
      },

      { transaction }
    );

    console.log(`[EventService] Event recorded: ${eventType} (ID: ${event.id})`);

    return event;
  }
}
