import { Event } from "../models/Event";
import { TrackEventPayload } from "../types/analytics.types";
import RealtimeService from "./realtime.service";
import { pubsub, LIVE_ANALYTICS_TOPIC } from "../realtime/pubsub";
import sequelize from "../config/database";
import { TriggerService } from "./trigger.service";
import { ALLOWED_EVENTS, ANALYTICS_EVENTS, AnalyticsEventType } from "../constants/analyticsEvents";

// Rate limiting store
const rateLimitMap = new Map<
  string,
  { count: number; timestamp: number }
>();

// Duplicate prevention
const lastEventMap = new Map<string, string>();

// Metadata validation
function validateMetadata(metadata: any) {
  if (!metadata) return;

  if (typeof metadata !== "object") {
    throw new Error("Invalid metadata format");
  }

  const size = JSON.stringify(metadata).length;

  if (size > 5000) {
    throw new Error("Metadata too large");
  }
}

export class AnalyticsService {
  // Track event and update real-time stats
  static async trackEvent(
    input: TrackEventPayload,
    context: any,
  ): Promise<boolean> {
    try {
      // Rate limit key
      const key =
        input.sessionId || context?.req?.ip || context?.ip || "anonymous";

      const now = Date.now();

      // RATE LIMIT (100 events/min per key)
      const limit = rateLimitMap.get(key);

      if (limit) {
        if (now - limit.timestamp > 60 * 1000) {
          rateLimitMap.set(key, { count: 1, timestamp: now });
        } else {
          if (limit.count >= 100) {
            throw new Error("Too many requests");
          }
          limit.count++;
        }
      } else {
        rateLimitMap.set(key, { count: 1, timestamp: now });
      }

      // 1. Normalize event name
      const normalizedEvent = input.event.trim().toUpperCase() as AnalyticsEventType;

      // Validate event
      if (!ALLOWED_EVENTS.has(normalizedEvent)) {
        throw new Error("Invalid event type");
      }

      // Validate metadata
      validateMetadata(input.metadata);

      // Prevent duplicate spam (same event back-to-back)
      const lastEvent = lastEventMap.get(input.sessionId);
      if (lastEvent === normalizedEvent) {
        return true;
      }
      lastEventMap.set(input.sessionId, normalizedEvent);

      // 2. Attach userId from context
      const userId = context?.user?.id || input.userId || null;

      // 3. Save event (SOURCE OF TRUTH)
      await Event.create({
        event: normalizedEvent,
        session_id: input.sessionId,
        user_id: userId,
        metadata: input.metadata || {},
      });

      // 4. Update real-time stats
      RealtimeService.processEvent(normalizedEvent, input.sessionId);

      // validation
      if (!ALLOWED_EVENTS.has(normalizedEvent)) {
        throw new Error("Invalid event type");
      }

      // 5. Trigger engine
      switch (normalizedEvent) {
        case ANALYTICS_EVENTS.ADD_TO_CART:
          TriggerService.handleCartActivity(input.sessionId);
          break;

        case ANALYTICS_EVENTS.CHECKOUT_STARTED:
          TriggerService.handleCheckoutActivity(input.sessionId);
          break;

        case ANALYTICS_EVENTS.PAYMENT_FAILED:
          TriggerService.recordPaymentFailure();
          break;

        case ANALYTICS_EVENTS.PAYMENT_SUCCESS:
          // optional: clear timers later
          break;
      }

      // 6. Publish live updates
      const stats = RealtimeService.getStats();

      await pubsub.publish(LIVE_ANALYTICS_TOPIC, {
        liveAnalytics: {
          ...stats,
          updatedAt: new Date(),
        },
      });

      return true;

    } catch (error) {
      console.error("❌ trackEvent failed:", {
        input,
        error,
      });

      // optional: send to logging service later (Sentry, etc.)

      throw new Error("Failed to track event");
    }
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

  // Get overview of analytics
  static async getOverview() {
    const result = await sequelize.query(`
    SELECT
      COUNT(*) AS "totalEvents",
      COUNT(DISTINCT user_id) AS "totalUsers",
      COUNT(DISTINCT session_id) AS "totalSessions"
    FROM events
  `, { type: "SELECT" });

    return result[0];
  }

  // Get funnel analytics
  static async getFunnel() {
    const result: any[] = await sequelize.query(`
    SELECT event, COUNT(DISTINCT session_id) as count
    FROM events
    WHERE event IN (
      'PRODUCT_VIEW',
      'ADD_TO_CART',
      'CHECKOUT_STARTED',
      'PAYMENT_SUCCESS'
    )
    GROUP BY event
  `, { type: "SELECT" });

    // Convert to map
    const map: Record<string, number> = {};

    result.forEach((row) => {
      map[row.event] = Number(row.count);
    });

    const steps = [
      "PRODUCT_VIEW",
      "ADD_TO_CART",
      "CHECKOUT_STARTED",
      "PAYMENT_SUCCESS",
    ];

    const funnel = [];

    for (let i = 0; i < steps.length; i++) {
      const current = steps[i];
      const next = steps[i + 1];

      const currentCount = map[current] || 0;
      const nextCount = map[next] || 0;

      const dropOff = i === steps.length - 1
        ? 0
        : currentCount - nextCount;

      const conversionRate = i === 0
        ? 100
        : currentCount
          ? (currentCount / (map[steps[0]] || 1)) * 100
          : 0;

      funnel.push({
        step: current,
        count: currentCount,
        dropOff,
        conversionRate: Number(conversionRate.toFixed(2)),
      });
    }

    return funnel;
  }

  // Get product analytics
  static async getProductAnalytics() {
    const result = await sequelize.query(`
    SELECT
      metadata->>'productId' AS "productId",

      COUNT(*) FILTER (WHERE event = 'PRODUCT_VIEW') AS "views",
      COUNT(*) FILTER (WHERE event = 'ADD_TO_CART') AS "addToCart",
      COUNT(*) FILTER (WHERE event = 'PAYMENT_SUCCESS') AS "purchases"

    FROM events
    WHERE metadata->>'productId' IS NOT NULL
    GROUP BY metadata->>'productId'
  `, { type: "SELECT" });

    return result;
  }
}
