// src/index.ts
import User from "../models/User";

const createUser = async () => {
  const user = await User.create({
    username: "John Doe",
    email: "john.doe@example.com",
  });
  console.log("User created:", user.toJSON());
};

const findUser = async () => {
  const user = await User.findOne({ where: { email: "john.doe@example.com" } });
  console.log("User found:", user?.toJSON());
};

const updateUser = async () => {
  const [updatedRows] = await User.update(
    { username: "Jane Doe" },
    { where: { email: "john.doe@example.com" } }
  );
  console.log("Updated rows:", updatedRows);
};

const deleteUser = async () => {
  const deletedRows = await User.destroy({
    where: { email: "john.doe@example.com" },
  });
  console.log("Deleted rows:", deletedRows);
};

const userService = async () => {
  await createUser();
  await findUser();
  await updateUser();
  await deleteUser();
};

export default userService;
