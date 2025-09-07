import "reflect-metadata";
import { HealthResolver } from "./api/graphql/resolvers/Health.resolver";
import { ApolloServer } from "@apollo/server";
import express, { Express } from "express";
import { UserResolver } from "./api/graphql/resolvers/User.resolver";
import { authChecker, getTokenFromRequest, verifyToken } from "./utils/auth";
import { OTPResolver } from "./api/graphql/resolvers/OTP.resolver";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import dotenv from "dotenv";
import { buildSchema } from "type-graphql";
import sequelize from "./config/database";
import Container from "typedi";
import { ProductResolver } from "./api/graphql/resolvers/Products.resolver";

async function bootstrap() {
  dotenv.config();
  const app: Express = express();
  const port = process.env.PORT || 4000;

  // 1. Build TypeGraphQL Schema
  const schema = await buildSchema({
    resolvers: [UserResolver, OTPResolver, ProductResolver, HealthResolver],
    authChecker: authChecker,
    validate: { forbidUnknownValues: false },
    container: Container,
  });

  // 2. Create Apollo Server
  const apolloServer = new ApolloServer({
    schema: schema,
    introspection: true,
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
  });

  await apolloServer.start();

  // ✅ CORS Configuration - Handled in Node.js
  const allowedOrigins = [
    "https://malicc.store",
    "https://www.malicc.store",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://studio.apollographql.com",
  ];

  const corsOptions = {
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
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
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
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

  // GraphQL endpoint
  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = getTokenFromRequest(req);
        if (!token) return { user: null };

        try {
          const payload = verifyToken(token);
          return { user: payload };
        } catch (error) {
          return { user: null };
        }
      },
    })
  );

  // Health check endpoint
  app.get("/health", (req, res) => {
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

  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌐 CORS enabled for: ${allowedOrigins.join(", ")}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🧪 Test CORS: http://localhost:${port}/test-cors`);
  });

  server.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });

  process.on("SIGTERM", () => {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}

bootstrap()
  .then(() => sequelize.sync({ alter: true }))
  .then(() => {
    console.log("Database synced");
  })
  .catch((err) => {
    console.error("Bootstrap failed:", err);
    process.exit(1);
  });
