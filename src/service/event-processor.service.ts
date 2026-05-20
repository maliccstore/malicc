import { ANALYTICS_EVENTS } from "../constants/event-constants";

class EventProcessorService {
  // In-memory tracking of active sessions and their states
  private static activeSessions = new Set<string>();
  private static cartsActive = new Set<string>();
  private static checkoutActive = new Set<string>();
  private static todayVisitorsCount = 0;

  // Process incoming events to update the state of active sessions
  static handleDiscoveryEvent(event: string, sessionId: string, metadata?: any) {
    // Ensure session is tracked as active
    if (!this.activeSessions.has(sessionId) && event !== ANALYTICS_EVENTS.SESSION_END) {
      this.activeSessions.add(sessionId);
    }

    switch (event) {
      case ANALYTICS_EVENTS.SESSION_START:
        // Already handled by session tracking check above
        break;

      case ANALYTICS_EVENTS.SESSION_END:
        this.removeSession(sessionId);
        break;

      case ANALYTICS_EVENTS.ADD_TO_CART:
        // Add session to active carts (duplicates ignored by Set)
        this.cartsActive.add(sessionId);
        break;

      case ANALYTICS_EVENTS.REMOVE_FROM_CART:
        // Only remove session from active carts if it's completely empty
        if (metadata?.isEmpty) {
          this.cartsActive.delete(sessionId);
        }
        break;

      case ANALYTICS_EVENTS.CHECKOUT_STARTED:
        // Transition: Remove from cart and add to checkout
        this.cartsActive.delete(sessionId);
        this.checkoutActive.add(sessionId);
        break;

      case ANALYTICS_EVENTS.PAYMENT_SUCCESS:
      case ANALYTICS_EVENTS.PAYMENT_FAILED:
        // End of checkout funnel
        this.checkoutActive.delete(sessionId);
        break;

      case ANALYTICS_EVENTS.PRODUCT_SEARCH:
      case ANALYTICS_EVENTS.PRODUCT_FILTER:
      case ANALYTICS_EVENTS.PRODUCT_SORT:
        console.log(`[Discovery Event] ${event} for session ${sessionId}`);
        break;

      case ANALYTICS_EVENTS.COUPON_APPLIED:
      case ANALYTICS_EVENTS.COUPON_FAILED:
        // Requirements: ensure session is added to checkoutActive set
        this.checkoutActive.add(sessionId);
        console.log(`[Coupon Event] ${event} for session ${sessionId}`);
        break;

      default:
        break;
    }

    console.log("Realtime Stats:", this.getStats());
  }
 
  static setTodayVisitors(count: number) {
    this.todayVisitorsCount = count;
  }

  // Remove a session from all active tracking sets
  static removeSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
    this.cartsActive.delete(sessionId);
    this.checkoutActive.delete(sessionId);
    console.log(`Session ${sessionId} removed from tracking`);
  }

  // Get current stats of active sessions
  static getStats() {
    return {
      activeSessions: this.activeSessions.size,
      cartsActive: this.cartsActive.size,
      checkoutActive: this.checkoutActive.size,
      todayVisitors: this.todayVisitorsCount,
    };
  }
}

export default EventProcessorService;

