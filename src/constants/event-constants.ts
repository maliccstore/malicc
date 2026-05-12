import { EVENTS } from "../events/constants/event.constants";

//  Map old analytics constants to new EDA event names
export const ANALYTICS_EVENTS = {
  PRODUCT_VIEW: EVENTS.PRODUCT_VIEWED,
  ADD_TO_CART: EVENTS.CART_ITEM_ADDED,
  CHECKOUT_STARTED: EVENTS.CHECKOUT_STARTED,
  PAYMENT_INITIATED: "payment.initiated",
  PAYMENT_SUCCESS: EVENTS.PAYMENT_SUCCESS,
  PAYMENT_FAILED: EVENTS.PAYMENT_FAILED,
  SESSION_START: EVENTS.SESSION_STARTED,
  SESSION_END: EVENTS.SESSION_ENDED,
  REMOVE_FROM_CART: EVENTS.CART_ITEM_REMOVED,
  PRODUCT_SEARCH: EVENTS.PRODUCT_SEARCHED,
  PRODUCT_FILTER: "product.filtered",
  PRODUCT_SORT: "product.sorted",
  COUPON_APPLIED: "coupon.applied",
  COUPON_FAILED: "coupon.failed",
} as const;


// Set for validation
export const ALLOWED_EVENTS = new Set<string>(
  Object.values(ANALYTICS_EVENTS)
);

// Optional type safety
export type AnalyticsEventType =
  typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];