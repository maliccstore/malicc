import { Resolver, Mutation, Arg } from "type-graphql";
import { TrackEventInput } from "../inputs/analytics.inputs";

@Resolver()
export class AnalyticsResolver {
  @Mutation(() => Boolean)
  async trackEvent(@Arg("input") input: TrackEventInput): Promise<boolean> {
    console.log("Event received:", {
      event: input.event,
      sessionId: input.sessionId,
      metadata: input.metadata,
      userId: input.userId,
    });

    return true;
  }
}
