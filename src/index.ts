import "reflect-metadata";

import { ApolloServer } from "@apollo/server";
// import {
//   ApolloServerPluginLandingPageLocalDefault,
//   ApolloServerPluginLandingPageProductionDefault,
// } from "@apollo/server/plugin/landingPage/default";
import express, { Express } from "express";
import { UserResolver } from "./api/graphql/resolvers/User.resolver"; // Adjust the path as needed

import { authChecker, getTokenFromRequest, verifyToken } from "./utils/auth";
import { OTPResolver } from "./api/graphql/resolvers/OTP.resolver";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import dotenv from "dotenv";

import { buildSchema } from "type-graphql";
import sequelize from "./config/database";
import Container from "typedi";

async function bootstrap() {
  dotenv.config();
  const app: Express = express();
  const port = process.env.PORT;
  // 1. Build TypeGraphQL Schema

  const schema = await buildSchema({
    resolvers: [UserResolver, OTPResolver],
    authChecker: authChecker,
    validate: { forbidUnknownValues: false },
    container: Container,
  });

  // 2. Create Apollo Server
  const apolloServer = new ApolloServer({
    schema: schema,
    introspection: true,
    // plugins: [
    //   // Install a landing page plugin based on NODE_ENV
    //   process.env.NODE_ENV === "production"
    //     ? ApolloServerPluginLandingPageProductionDefault({
    //         graphRef: "my-graph-id@my-graph-variant",
    //         footer: false,
    //       })
    //     : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    // ],
    // includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = getTokenFromRequest(req);
        if (!token) return { user: null };

        try {
          const payload = verifyToken(token);
          return { user: payload }; // Now the email is in payload.email
        } catch (error) {
          return { user: null };
        }
      },
    })
  );
  app.listen(port, () => {
    console.log("Server running on port", port);
  });

  app.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}

bootstrap();
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");
});
