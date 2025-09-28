export interface SessionData {
  sessionId: string;
  userId?: string;
  guestId: string;
  userRole: string;
  createdAt: Date;
  expiresAt: Date;
  lastAccessed: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface CreateSessionInput {
  userId?: string;
  userRole: string;
  userAgent?: string;
  ipAddress?: string;
}
