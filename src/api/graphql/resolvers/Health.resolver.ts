import { Resolver, Query } from "type-graphql";
import { Service } from "typedi";
import { HealthCheck } from "../schemas/health.schema";

@Service()
@Resolver()
export class HealthResolver {
  @Query(() => HealthCheck)
  async healthCheck(): Promise<HealthCheck> {
    return {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: "Service is healthy",
    };
  }

  @Query(() => String)
  async ping(): Promise<string> {
    return "pong";
  }
}
