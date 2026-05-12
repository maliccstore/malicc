import { EventType } from "../constants/event.constants";

export interface EventPayload<T = any> {
  eventId: string;
  eventType: EventType | string;
  storeId: string;
  timestamp: string;
  payload: T;
  metadata: {
    version: string;
    source: string;
  };
}

export interface EmitEventOptions {
  eventType: EventType | string;
  payload: any;
  storeId: string;
  userId?: number;
  sessionId?: string;
  metadata?: Record<string, any>;
  transaction?: any; // Sequelize transaction
}
