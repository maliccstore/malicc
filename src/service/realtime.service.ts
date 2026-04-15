class RealtimeService {
  // In-memory tracking of active sessions and their states
  private static activeUsers = new Set<string>();
  private static cartsActive = new Set<string>();
  private static checkoutActive = new Set<string>();

  // Process incoming events to update the state of active sessions
  static processEvent(event: string, sessionId: string, metadata?: any) {
    switch (event) {
      case "SESSION_START":
        this.activeUsers.add(sessionId);
        break;

      case "SESSION_END":
        this.removeSession(sessionId);
        break;

      case "ADD_TO_CART":
        // Add session to active carts (duplicates ignored by Set)
        this.cartsActive.add(sessionId);
        break;

      case "REMOVE_FROM_CART":
        // Only remove session from active carts if it's completely empty
        if (metadata?.isEmpty) {
          this.cartsActive.delete(sessionId);
        }
        break;

      case "CHECKOUT_STARTED":
        this.checkoutActive.add(sessionId);
        break;

      case "CHECKOUT_COMPLETED":
        this.checkoutActive.delete(sessionId);
        this.cartsActive.delete(sessionId);
        break;

      default:
        break;
    }

    console.log("Realtime Stats:", this.getStats());
  }

  // Remove a session from all active tracking sets
  static removeSession(sessionId: string) {
    this.activeUsers.delete(sessionId);
    this.cartsActive.delete(sessionId);
    this.checkoutActive.delete(sessionId);
    console.log(`Session ${sessionId} removed from tracking`);
  }

  // Get current stats of active sessions
  static getStats() {
    return {
      activeUsers: this.activeUsers.size,
      cartsActive: this.cartsActive.size,
      checkoutActive: this.checkoutActive.size,
    };
  }
}

export default RealtimeService;
