/// <reference types="node" />
import { createClient } from 'graphql-ws';
import { WebSocket } from 'ws';

const client = createClient({
  url: 'ws://localhost:8000/graphql',
  webSocketImpl: WebSocket,
});

(async () => {
  console.log('📡 Listener started. Connecting to ws://localhost:8000/graphql ...');
  
  const subscription = client.iterate({
    query: `
      subscription {
        liveAnalytics {
          activeUsers
          cartsActive
          checkoutActive
          updatedAt
        }
      }
    `,
  });

  console.log('⌛ Waiting for events...');

  try {
    for await (const result of subscription) {
      console.log('📦 Raw result received:', JSON.stringify(result, null, 2));
      if (result.data) {
        console.log('🚀 [LIVE UPDATE RECEIVED]:', JSON.stringify(result.data.liveAnalytics, null, 2));
      } else {
        console.log('⚠️ Received message but result.data is missing.');
      }
    }
  } catch (err) {
    console.error('❌ Subscription error:', err);
  }
})();
