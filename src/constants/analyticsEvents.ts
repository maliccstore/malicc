
//  Define all allowed events
export const ANALYTICS_EVENTS = {
  PRODUCT_VIEW: "PRODUCT_VIEW",
  ADD_TO_CART: "ADD_TO_CART",
  CHECKOUT_STARTED: "CHECKOUT_STARTED",
  PAYMENT_INITIATED: "PAYMENT_INITIATED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  SESSION_START: "SESSION_START",
  SESSION_END: "SESSION_END",
  REMOVE_FROM_CART: "REMOVE_FROM_CART",
} as const;

// Set for validation
export const ALLOWED_EVENTS = new Set<string>(
  Object.values(ANALYTICS_EVENTS)
);

// Optional type safety
export type AnalyticsEventType =
  typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];