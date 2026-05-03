import { Resolver, Mutation, Arg, Ctx, Subscription, Root, Query, Int } from "type-graphql";
import { Service } from "typedi";
import { TrackEventInput } from "../inputs/analytics.inputs";
import { AnalyticsService } from "../../../service/analytics.service";
import { LiveAnalyticsPayload } from "../schemas/analytics.schema";
import { pubsub, LIVE_ANALYTICS_TOPIC } from "../../../realtime/pubsub";
import { AnalyticsOverview, FunnelStep, ProductAnalytics } from "../schemas/analytics.schema";

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

  @Mutation(() => Boolean)
  async identify(
    @Arg("sessionId") sessionId: string,
    @Ctx() context: any
  ): Promise<boolean> {

    const userId = context?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    return AnalyticsService.identify(sessionId, userId, context?.user?.role);
  }

  // ─── Query ────────────────────────────────────────────────────────────────

  @Query(() => AnalyticsOverview)
  async analyticsOverview() {
    return AnalyticsService.getOverview();
  }

  @Query(() => [FunnelStep])
  async analyticsFunnel() {
    return AnalyticsService.getFunnel();
  }

  @Query(() => [ProductAnalytics])
  async analyticsProducts() {
    return AnalyticsService.getProductAnalytics();
  }

  @Query(() => Int)
  async todayVisitors() {
    return AnalyticsService.getTodayVisitors();
  }


  // ─── Subscription ─────────────────────────────────────────────────────────────

  /**
   * Clients subscribe here to receive real-time analytics snapshots.
   * A new payload is pushed every time an event is ingested via `trackEvent`.
   *
   * Example client operation:
   *   subscription {
   *     liveAnalytics {
   *       activeSessions
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
