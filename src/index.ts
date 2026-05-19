import "reflect-metadata";
import "./config"; // Load and validate environment variables first!
import { formatGraphQLError } from "./utils/errorHandler";
import path from "path";
import { HealthResolver } from "./api/graphql/resolvers/Health.resolver";
import { ApolloServer } from "@apollo/server";
import express, { Express } from "express";
import { UserResolver } from "./api/graphql/resolvers/User.resolver";
import { authChecker, getTokenFromRequest, verifyToken } from "./utils/auth";
import { OTPResolver } from "./api/graphql/resolvers/OTP.resolver";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { buildSchema } from "type-graphql";
import sequelize from "./config/database";
import Container from "typedi";
import { ProductResolver } from "./api/graphql/resolvers/Products.resolver";
import { SessionResolver } from "./api/graphql/resolvers/Session.resolver";
import { CartResolver } from "./api/graphql/resolvers/Cart.resolver";
import { createContext } from "./api/graphql/context";
import cookieParser from "cookie-parser";
import { sessionMiddleware } from "./middlewares/session";
import { InventoryResolver } from "./api/graphql/resolvers/Inventory.resolver";
import { OrderResolver } from "./api/graphql/resolvers/Order.resolver";
import { AddressResolver } from "./api/graphql/resolvers/address.resolver";
import { CategoryResolver } from "./api/graphql/resolvers/Category.resolver";
import { CouponResolver } from "./api/graphql/resolvers/Coupon.resolver";
import { AdminCouponResolver } from "./api/graphql/resolvers/AdminCoupon.resolver";
import { CouponExpirationJob } from "./jobs/couponExpiration.job";
import { PaymentResolver } from "./api/graphql/resolvers/Payment.resolver";
import { ReviewResolver } from "./api/graphql/resolvers/review.resolver";
import uploadRoutes from "./api/routes/upload.routes";
import webhookRoutes from "./api/routes/webhook.routes";
import storeSettingsRoutes from "./api/routes/storeSettings.routes";
import { OrderCleanupJob } from "./jobs/OrderCleanup.job";
import { AnalyticsResolver } from "./api/graphql/resolvers/Analytics.resolver";
import { AdminMarketingResolver } from "./api/graphql/resolvers/AdminMarketing.resolver";
import { HomepageResolver } from "./api/graphql/resolvers/Homepage.resolver";
import whatsappRoutes from "./api/routes/whatsapp.routes";
import { UsageSyncJob } from "./jobs/usageSync.job";
import requestSniffer from "./middlewares/requestsniffer";
// WebSocket subscription support
import { execute, subscribe } from "graphql";
import { WebSocketServer } from "ws";
const { useServer } = require("graphql-ws/use/ws");
import { pubsub } from "./realtime/pubsub";

async function bootstrap() {
  const app: Express = express();
  const port = process.env.PORT;

  // 1. Build TypeGraphQL Schema
  const schema = await buildSchema({
    resolvers: [
      UserResolver,
      OTPResolver,
      ProductResolver,
      HealthResolver,
      SessionResolver,
      CartResolver,
      InventoryResolver,
      OrderResolver,
      AddressResolver,
      CategoryResolver,
      CouponResolver,
      AdminCouponResolver,
      PaymentResolver,
      ReviewResolver,
      AnalyticsResolver,
      AdminMarketingResolver,
      HomepageResolver,
    ],
    authChecker: authChecker,
    validate: { forbidUnknownValues: false },
    container: Container,
    // Provide the pubsub engine for subscriptions
    pubSub: pubsub as any,
  });

  // 2. Create Apollo Server (HTTP only — subscriptions handled via WS below)
  const apolloServer = new ApolloServer({
    schema: schema,
    introspection: true,
    formatError: formatGraphQLError,
  });

  await apolloServer.start();

  // cookie-parser
  app.use(cookieParser());

  // Bandwidth tracking middleware — must be before all routes
  app.use(requestSniffer);
  // ✅ CORS Configuration - Handled in Node.js
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

  const corsOptions = {
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  // Handle preflight requests for all routes
  // app.options("*", cors(corsOptions));
  // Apply CORS to all routes
  app.use(cors(corsOptions));

  // Parse JSON bodies for REST routes
  app.use(express.json());

  // Session Middleware
  app.use(sessionMiddleware);

  // Modular Upload Routes
  app.use("/api/admin/uploads", uploadRoutes);

  // Store Appearance Routes
  app.use("/api/admin/appearance", storeSettingsRoutes);

  // Webhook Routes
  app.use("/api/webhooks", webhookRoutes);

  // WhatsApp Marketing Routes
  app.use("/api/whatsapp", whatsappRoutes);

  // Static File Serving for uploads
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "public", "uploads")),
  );

  // GraphQL endpoint
  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => {
        const token = getTokenFromRequest(req);
        let user = null;

        if (token) {
          try {
            const payload = verifyToken(token);
            user = payload;
            (req as any).user = user;
          } catch (error) {
            console.log("Invalid token:", error);
          }
        }

        return createContext({ req, res });
      },
    }),
  );

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      cors: "handled-by-nodejs",
    });
  });

  // Test endpoint for CORS
  app.options("/test-cors", cors(corsOptions));
  app.get("/test-cors", cors(corsOptions), (req, res) => {
    res.json({
      message: "CORS is working!",
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin,
    });
  });

  // ─── Start HTTP Server ─────────────────────────────────────────────────────
  const httpServer = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌐 CORS enabled for: ${allowedOrigins.join(", ")}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🧪 Test CORS: http://localhost:${port}/test-cors`);
  });

  // ─── WebSocket Subscription Server ────────────────────────────────────────
  // Subscriptions are served on the same port as HTTP, at ws://<host>/graphql
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // Attach graphql-ws to the WS server
  useServer(
    {
      schema,
      execute,
      subscribe,
    },
    wsServer,
  );

  console.log(
    `🔌 WebSocket subscription server ready at ws://localhost:${port}/graphql`,
  );

  httpServer.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });

  process.on("SIGTERM", async () => {
    httpServer.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}

bootstrap()
  .then(() => sequelize.sync())
  .then(() => {
    console.log("Database synced");
  })
  .then(() => {
    CouponExpirationJob.start();
    OrderCleanupJob.start();
    UsageSyncJob.start();
  })
  .catch((err) => {
    console.error("Bootstrap failed:", err);
    process.exit(1);
  });
