export class TriggerService {
    private static cartTimers = new Map<string, NodeJS.Timeout>();
    private static checkoutTimers = new Map<string, NodeJS.Timeout>();

    private static paymentFailures: number[] = [];

    // Cart inactivity
    static handleCartActivity(sessionId: string) {
        // clear old timer
        if (this.cartTimers.has(sessionId)) {
            clearTimeout(this.cartTimers.get(sessionId)!);
        }

        // start new timer (e.g. 5 min)
        const timer = setTimeout(() => {
            console.log("⚠️ Cart Abandoned:", sessionId);

            this.emit("CART_ABANDONED", { sessionId });
            this.cartTimers.delete(sessionId);
        }, 5 * 60 * 1000);

        this.cartTimers.set(sessionId, timer);
    }

    // Checkout inactivity 
    static handleCheckoutActivity(sessionId: string) {
        if (this.checkoutTimers.has(sessionId)) {
            clearTimeout(this.checkoutTimers.get(sessionId)!);
        }

        const timer = setTimeout(() => {
            console.log("⚠️ Checkout Abandoned:", sessionId);

            this.emit("CHECKOUT_ABANDONED", { sessionId });
            this.checkoutTimers.delete(sessionId);
        }, 5 * 60 * 1000);

        this.checkoutTimers.set(sessionId, timer);
    }

    // Payment failure spikes
    static recordPaymentFailure() {
        const now = Date.now();
        this.paymentFailures.push(now);

        // keep last 5 min only
        this.paymentFailures = this.paymentFailures.filter(
            (t) => now - t < 5 * 60 * 1000
        );

        if (this.paymentFailures.length >= 5) {
            console.log("🚨 Payment Failure Spike Detected");

            this.emit("PAYMENT_FAILURE_SPIKE", {
                count: this.paymentFailures.length,
            });

            this.paymentFailures = []; // reset
        }
    }

    // Internal Event Emitter
    static emit(event: string, payload: any) {
        console.log("Trigger Event:", event, payload);

        // future:
        // - send notification
        // - push to queue
        // - webhook
    }
}
