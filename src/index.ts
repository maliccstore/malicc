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

  const allowedOrigins = [
    "http://localhost:3000", // Local development
    "https://malicc.store", // Your production frontend
    "https://www.malicc.store", // WWW version
    "https://studio.apollographql.com", // Apollo Studio
    process.env.FRONTEND_URL, // From environment variable
  ].filter(Boolean);

  // Simplified CORS - Let Nginx handle the actual CORS headers
  app.use(
    "/graphql",
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (
          allowedOrigins.includes(origin) ||
          process.env.NODE_ENV === "development"
        ) {
          callback(null, true);
        } else {
          console.warn(`Blocked by CORS: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      }, // Disable Express CORS since Nginx handles it
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
    }),
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
  app.get("/health", (_, res) => {
    res.status(200).json({ status: "healthy" });
  });

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
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
