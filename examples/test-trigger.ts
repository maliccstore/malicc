/// <reference types="node" />
import http, { IncomingMessage, ClientRequest, RequestOptions } from 'http';

/**
 * This script sends a 'trackEvent' mutation to the GraphQL server.
 * This should trigger the 'liveAnalytics' subscription to push an update.
 */

const data = JSON.stringify({
  query: `
    mutation TrackEvent($input: TrackEventInput!) {
      trackEvent(input: $input)
    }
  `,
  variables: {
    input: {
      event: "ADD_TO_CART",
      sessionId: "test-session-" + Math.random().toString(36).substring(7),
      metadata: { item: "Super cool product" }
    }
  }
});

const options: RequestOptions = {
  hostname: 'localhost',
  port: 8000,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req: ClientRequest = http.request(options, (res: IncomingMessage) => {
  let responseData = '';
  res.on('data', (chunk: any) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('✅ Mutation Sent. Server Response:', responseData);
  });
});

req.on('error', (error: Error) => {
  console.error('❌ Error sending mutation:', error.message);
});

console.log('🚀 Triggering ADD_TO_CART event via mutation...');
req.write(data);
req.end();
