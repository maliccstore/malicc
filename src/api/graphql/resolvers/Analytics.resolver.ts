import { Resolver, Mutation, Arg, Ctx, Subscription, Root } from "type-graphql";
import { Service } from "typedi";
import { TrackEventInput } from "../inputs/analytics.inputs";
import { AnalyticsService } from "../../../service/analytics.service";
import { LiveAnalyticsPayload } from "../schemas/analytics.schema";
import { pubsub, LIVE_ANALYTICS_TOPIC } from "../../../realtime/pubsub";

@Service()
@Resolver()
export class AnalyticsResolver {
  // ─── Mutation ────────────────────────────────────────────────────────────────

  @Mutation(() => Boolean)
  async trackEvent(
    @Arg("input") input: TrackEventInput,
    @Ctx() context: any,
  ): Promise<boolean> {
    return AnalyticsService.trackEvent(input, context);
  }

  // ─── Subscription ─────────────────────────────────────────────────────────────

  /**
   * Clients subscribe here to receive real-time analytics snapshots.
   * A new payload is pushed every time an event is ingested via `trackEvent`.
   *
   * Example client operation:
   *   subscription {
   *     liveAnalytics {
   *       activeUsers
   *       cartsActive
   *       checkoutActive
   *       updatedAt
   *     }
   *   }
   */
  @Subscription(() => LiveAnalyticsPayload, {
    subscribe: () => pubsub.asyncIterator(LIVE_ANALYTICS_TOPIC),
  })
  liveAnalytics(
    @Root() payload: { liveAnalytics: LiveAnalyticsPayload },
  ): LiveAnalyticsPayload {
    return payload.liveAnalytics;
  }
}
