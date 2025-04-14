import "reflect-metadata";

import { ApolloServer } from "@apollo/server";
import express, { Express } from "express";
import { UserResolver } from "./api/graphql/resolvers/User.resolver"; // Adjust the path as needed
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import dotenv from "dotenv";
//import UserRouter from "./api/User.route";
import { buildSchema } from "type-graphql";
import sequelize from "./config/database";
import Container from "typedi";
// import { json } from "body-parser";

async function bootstrap() {
  dotenv.config();
  const app: Express = express();
  const port = process.env.PORT;
  // 1. Build TypeGraphQL Schema

  const schema = await buildSchema({
    resolvers: [UserResolver],
    validate: { forbidUnknownValues: false },
    container: Container,
  });

  // 2. Create Apollo Server
  const apolloServer = new ApolloServer({
    schema: schema,
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({ token: req.headers.authorization }),
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
// app.use(express.json());
// app.use("/api", UserRouter);

// function root(req: Request, res: Response): void {
//   res.status(200).json({ message: "This is root path of malicc server" });
// }

// app.get("/", root);
