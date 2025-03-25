// src/index.ts

import User from "../models/User.ts";

type USERT = {
  username: string;
  email: string;
  password: string;
};

const userService = {
  createUser: async ({ username, email, password }: USERT) => {
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
