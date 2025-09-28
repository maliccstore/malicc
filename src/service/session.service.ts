import { Service } from "typedi";
import { Session } from "../models/Session";
import { SessionData, CreateSessionInput } from "../interface/session";
import { v4 as uuidv4 } from "uuid";

@Service()
export class SessionService {
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly GUEST_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Generate session ID
  private generateSessionId(): string {
    return `sess_${uuidv4()}`;
  }

  // Generate guest ID
  private generateGuestId(): string {
    return `guest_${uuidv4()}`;
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

  // Find session by ID
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

  // Find session by user ID (for logged-in users)
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

  // Update session data
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

  // Convert user session (when guest logs in)
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

  // Destroy session
  async destroySession(sessionId: string): Promise<boolean> {
    const result = await Session.destroy({
      where: { sessionId },
    });

    return result > 0;
  }

  // Clean up expired sessions
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

  // Helper to map Sequelize model to SessionData interface
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
