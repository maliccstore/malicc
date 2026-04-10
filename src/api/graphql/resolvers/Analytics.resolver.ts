import { Resolver, Mutation, Arg } from "type-graphql";
import { Event } from "../schemas/analytics.schema";
import { TrackEventInput } from "../inputs/analytics.inputs";

@Resolver()
export class AnalyticsResolver {
  // Placeholder (real logic later)
  @Mutation(() => Boolean)
  async trackEvent(@Arg("input") input: TrackEventInput): Promise<boolean> {
    console.log("Event received:", input);

    // later → call analytics.service.ts
    return true;
  }
}
