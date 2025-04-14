// import User from "../../../models/User";
import { UserService } from "../../../service/user.service";
import { Query, Resolver, Arg } from "type-graphql";
import { Service } from "typedi";
import { UserType } from "../schemas/user.schema";

@Service()
@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserType])
  async users() {
    try {
      return await this.userService.findAllUsers();
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to fetch users");
    }
  }

  @Query(() => UserType, { nullable: true })
  async user(@Arg("id") id: number) {
    return this.userService.findUser(id);
  }
}
