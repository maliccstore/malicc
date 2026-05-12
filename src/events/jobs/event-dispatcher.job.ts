import { EventDispatcherService } from "../services/event-dispatcher.service";

/**
 * Polling job that runs every 10 seconds to process pending events.
 */
export const startEventDispatcherJob = () => {
  console.log("[EventDispatcherJob] Starting polling worker (Interval: 10s)");
  
  setInterval(async () => {
    try {
      await EventDispatcherService.processPendingEvents();
    } catch (error) {
      console.error("[EventDispatcherJob] Fatal error in polling worker:", error);
    }
  }, 10000);
};
