import { Service } from "typedi";
import { Session } from "../models/Session";
import { SessionData, CreateSessionInput } from "../interface/session";

@Service()
export class SessionService {
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly GUEST_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Generate session ID using crypto.randomUUID()
  private generateSessionId(): string {
    return `sess_${crypto.randomUUID()}`;
  }

  // Generate guest ID using crypto.randomUUID()
  private generateGuestId(): string {
    return `guest_${crypto.randomUUID()}`;
  }

  // Create a new session
  async createSession(input: CreateSessionInput): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const guestId = input.userId
      ? `user_${input.userId}`
      : this.generateGuestId();

    const expiresAt = new Date(
      Date.now() +
        (input.userRole === "guest"
          ? this.GUEST_SESSION_DURATION
          : this.SESSION_DURATION)
    );

    const session = await Session.create({
      sessionId,
      userId: input.userId,
      guestId,
      userRole: input.userRole,
      expiresAt,
      lastAccessed: new Date(),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    return this.mapToSessionData(session);
  }

  // ... rest of your session service methods remain the same
  async findSession(sessionId: string): Promise<SessionData | null> {
    const session = await Session.findByPk(sessionId);

    if (!session || session.isExpired()) {
      if (session && session.isExpired()) {
        await this.destroySession(sessionId);
      }
      return null;
    }

    // Update last accessed time
    session.lastAccessed = new Date();
    await session.save();

    return this.mapToSessionData(session);
  }

  async findSessionByUserId(userId: string): Promise<SessionData | null> {
    const session = await Session.findOne({
      where: { userId },
    });

    if (!session || session.isExpired()) {
      return null;
    }

    session.lastAccessed = new Date();
    await session.save();

    return this.mapToSessionData(session);
  }

  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<SessionData | null> {
    const session = await Session.findByPk(sessionId);

    if (!session || session.isExpired()) {
      return null;
    }

    await session.update({
      ...updates,
      lastAccessed: new Date(),
    });

    return this.mapToSessionData(session);
  }

  async convertToUserSession(
    sessionId: string,
    userId: string,
    userRole: string
  ): Promise<SessionData | null> {
    const session = await Session.findByPk(sessionId);

    if (!session) {
      return null;
    }

    await session.update({
      userId,
      userRole,
      guestId: `user_${userId}`,
      expiresAt: new Date(Date.now() + this.SESSION_DURATION),
    });

    return this.mapToSessionData(session);
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const result = await Session.destroy({
      where: { sessionId },
    });

    return result > 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await Session.destroy({
      where: {
        expiresAt: {
          $lt: new Date(),
        },
      },
    });

    return result;
  }

  private mapToSessionData(session: Session): SessionData {
    return {
      sessionId: session.sessionId,
      userId: session.userId,
      guestId: session.guestId,
      userRole: session.userRole,
      createdAt: session.createdAt!,
      expiresAt: session.expiresAt,
      lastAccessed: session.lastAccessed,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    };
  }
}
