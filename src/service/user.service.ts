// src/index.ts

import User from "../models/User";
import { UserType } from "@/types/user";

//  These are the use services for the user,
//  Either to Create, Find, Update or Delete a User

const userService = {
  createUser: async ({ username, email, password }: UserType) => {
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
  },

  findUser: async () => {
    const user = await User.findOne({
      where: { email: "john.doe@example.com" },
    });
    console.log("User found:", user?.toJSON());
  },

  updateUser: async () => {
    const [updatedRows] = await User.update(
      { username: "Jane Doe" },
      { where: { email: "john.doe@example.com" } }
    );
    console.log("Updated rows:", updatedRows);
  },

  deleteUser: async () => {
    const deletedRows = await User.destroy({
      where: { email: "john.doe@example.com" },
    });
    console.log("Deleted rows:", deletedRows);
  },
};

export default userService;
