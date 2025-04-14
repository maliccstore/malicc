import "reflect-metadata";
// src/index.ts
import { Service } from "typedi";
import User from "../models/User";
import { UserType } from "@/api/graphql/schemas/user.schema";

//  These are the use services for the user,
//  Either to Create, Find, Update or Delete a User

@Service()
export class UserService {
  async createUser({ username, email, password }: UserType) {
    try {
      const user = await User.create({
        username: username,
        email: email,
        password: password,
      });
      console.log("User created:", user.toJSON());
    } catch (error) {
      if (error) {
        throw new Error("Username or email already exists");
      }
    }
  }

  async findUser(id: number) {
    try {
      return await User.findByPk(id);
    } catch {
      return null;
    }
  }
  async findAllUsers(): Promise<UserType[]> {
    return await User.findAll();
  }
  async updateUser(emailToFind: string, updatedData: Partial<UserType>) {
    const [updatedRows] = await User.update(updatedData, {
      where: { email: emailToFind },
    });
    return updatedRows;
  }

  async deleteUser(emailToDelete: string) {
    const deletedRows = await User.destroy({
      where: { email: emailToDelete },
    });
    return deletedRows;
  }
}

async function Test() {
  console.log("Initializing New component");
  const userInstance = new UserService();
  const users = await userInstance.findAllUsers();
  console.log(users);
  process.exit(1);
}
