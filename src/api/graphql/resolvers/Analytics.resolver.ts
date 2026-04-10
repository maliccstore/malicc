import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
import { Service } from "typedi"; // 👈 IMPORTANT
import { TrackEventInput } from "../inputs/analytics.inputs";
import { AnalyticsService } from "../../../service/analytics.service";

@Service() // 👈 ADD THIS
@Resolver()
export class AnalyticsResolver {
  @Mutation(() => Boolean)
  async trackEvent(
    @Arg("input") input: TrackEventInput,
    @Ctx() context: any,
  ): Promise<boolean> {
    return AnalyticsService.trackEvent(input, context);
  }
}
