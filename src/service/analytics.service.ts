import { Event } from "../models/Event";
import { TrackEventPayload } from "../types/analytics.types";
import RealtimeService from "./realtime.service";
import { pubsub, LIVE_ANALYTICS_TOPIC } from "../realtime/pubsub";
import sequelize from "../config/database";

export class AnalyticsService {
  // Track event and update real-time stats
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
