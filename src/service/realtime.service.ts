class RealtimeService {
  // In-memory tracking of active sessions and their states
  private static activeUsers = new Set<string>();
  private static cartsActive = new Set<string>();
  private static checkoutActive = new Set<string>();

  // Process incoming events to update the state of active sessions
  static processEvent(event: string, sessionId: string) {
    switch (event) {
      case "SESSION_START":
        this.activeUsers.add(sessionId);
        break;

      case "SESSION_END":
        this.activeUsers.delete(sessionId);
        this.cartsActive.delete(sessionId);
        this.checkoutActive.delete(sessionId);
        break;

      case "ADD_TO_CART":
        this.cartsActive.add(sessionId);
        break;

      case "REMOVE_FROM_CART":
        this.cartsActive.delete(sessionId);
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
