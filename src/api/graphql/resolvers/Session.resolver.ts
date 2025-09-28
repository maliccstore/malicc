import { Resolver, Query, Mutation, Ctx, Authorized } from "type-graphql";
import { Service } from "typedi";
import { SessionService } from "../../../service/session.service";
import { GraphQLContext } from "../../graphql/context";
import { SessionData } from "../../../interface/session";

@Service()
@Resolver()
export class SessionResolver {
  constructor(private sessionService: SessionService) {}

  @Query(() => SessionData, { nullable: true })
  async getSession(@Ctx() ctx: GraphQLContext): Promise<SessionData | null> {
    return ctx.session || null;
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: GraphQLContext): Promise<boolean> {
    if (!ctx.session) {
      return true;
    }

    const success = await this.sessionService.destroySession(
      ctx.session.sessionId
    );

    // Clear cookie
    ctx.res.clearCookie("sessionId");

    return success;
  }

  @Authorized()
  @Mutation(() => SessionData)
  async refreshSession(@Ctx() ctx: GraphQLContext): Promise<SessionData> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    const updatedSession = await this.sessionService.updateSession(
      ctx.session.sessionId,
      {
        lastAccessed: new Date(),
      }
    );

    if (!updatedSession) {
      throw new Error("Failed to refresh session");
    }

    return updatedSession;
  }
}
