export const EVENTS = {
  // Business Events
  ORDER_CREATED: "order.created",
  ORDER_CANCELLED: "order.cancelled",

  CAMPAIGN_SENT: "campaign.sent",
  CAMPAIGN_FAILED: "campaign.failed",

  STORE_PROVISIONED: "store.provisioned",

  // Session Events
  SESSION_STARTED: "session.started",
  SESSION_ENDED: "session.ended",

  // Product Events
  PRODUCT_VIEWED: "product.viewed",
  PRODUCT_SEARCHED: "product.searched",

  // Cart Events
  CART_ITEM_ADDED: "cart.item_added",
  CART_ITEM_REMOVED: "cart.item_removed",

  // Checkout Events
  CHECKOUT_STARTED: "checkout.started",
  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",
  
  // Generic usage
  USAGE_TRACKED: "usage.tracked",
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];

