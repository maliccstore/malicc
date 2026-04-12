import { Event } from "../models/Event";
import { TrackEventPayload } from "../types/analytics.types";
import RealtimeService from "./realtime.service";
import { pubsub, LIVE_ANALYTICS_TOPIC } from "../realtime/pubsub";

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

    // 4. Update real-time stats
    RealtimeService.processEvent(normalizedEvent, input.sessionId);

    // 5. Publish updated stats to all active GraphQL subscribers
    const stats = RealtimeService.getStats();
    await pubsub.publish(LIVE_ANALYTICS_TOPIC, {
      liveAnalytics: {
        ...stats,
        updatedAt: new Date(),
      },
    });

    return true;
  }

  // Identify user with session id
  static async identify(
    sessionId: string,
    userId: string | number
  ): Promise<boolean> {

    if (!userId) {
      return false;
    }

    // Update all events for this session
    await Event.update(
      { user_id: userId },
      {
        where: {
          session_id: sessionId,
        },
      }
    );

    return true;
  }

}
