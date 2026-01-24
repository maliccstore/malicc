export enum OrderStatus {
  CREATED = "CREATED", // Order row exists, nothing paid
  PAYMENT_PENDING = "PAYMENT_PENDING", // Redirected to gateway / waiting webhook
  PAID = "PAID", // Money confirmed
  FULFILLED = "FULFILLED", // Shipped / delivered (you can split later)
  CANCELLED = "CANCELLED", // User/admin cancelled before fulfillment
  FAILED = "FAILED", // Payment failed / expired
}
