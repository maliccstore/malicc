import { Resolver, Query, Mutation, Ctx, Authorized } from "type-graphql";
import { Service } from "typedi";
import { SessionService } from "../../../service/session.service";
import { GraphQLContext } from "../../graphql/context";
import { SessionType } from "../schemas/session.schema";

@Service()
@Resolver()
export class SessionResolver {
  constructor(private sessionService: SessionService) {}

  @Query(() => SessionType, { nullable: true })
  async getSession(@Ctx() ctx: GraphQLContext): Promise<SessionType | null> {
    console.log("🔍 SessionResolver.getSession called");
    console.log("📦 Context session:", ctx.session);

    if (!ctx.session) {
      console.log("❌ No session in context");
      return null;
    }

    console.log("✅ Returning session:", ctx.session.sessionId);

    // Convert SessionData to SessionType
    return {
      sessionId: ctx.session.sessionId,
      userId: ctx.session.userId,
      guestId: ctx.session.guestId,
      userRole: ctx.session.userRole,
      createdAt: ctx.session.createdAt,
      expiresAt: ctx.session.expiresAt,
      lastAccessed: ctx.session.lastAccessed,
      userAgent: ctx.session.userAgent,
      ipAddress: ctx.session.ipAddress,
    };
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
  @Mutation(() => SessionType)
  async refreshSession(@Ctx() ctx: GraphQLContext): Promise<SessionType> {
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

    // Convert SessionData to SessionType
    return {
      sessionId: updatedSession.sessionId,
      userId: updatedSession.userId,
      guestId: updatedSession.guestId,
      userRole: updatedSession.userRole,
      createdAt: updatedSession.createdAt,
      expiresAt: updatedSession.expiresAt,
      lastAccessed: updatedSession.lastAccessed,
      userAgent: updatedSession.userAgent,
      ipAddress: updatedSession.ipAddress,
    };
  }
}
