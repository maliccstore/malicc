import { Event } from "../models/Event";
import { TrackEventPayload } from "../types/analytics.types";

export class AnalyticsService {
  static async trackEvent(
    input: TrackEventPayload,
    context: any,
  ): Promise<boolean> {
    // 1. Normalize event name
    const normalizedEvent = input.event.trim().toUpperCase();

    // 2. Attach userId from context (if available)
    const userId = context?.user?.id || input.userId || null;

    // 3. Save event
    await Event.create({
      event: normalizedEvent,
      session_id: input.sessionId,
      user_id: userId,
      metadata: input.metadata || {},
    });

    return true;
  }
}
