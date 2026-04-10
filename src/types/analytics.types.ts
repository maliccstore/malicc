export interface TrackEventPayload {
  event: string;
  sessionId: string;
  metadata?: Record<string, any>;
  userId?: string;
}
