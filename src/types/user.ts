export type UserType = {
  username: string;
  email: string;
  password: string;
};

export type UserService = {
  createUser: (user: UserType) => Promise<void>;
  findUser: (username: string) => Promise<UserType | null>;
  findAllUsers: () => Promise<UserType[]>;
  updateUser: () => Promise<void>;
  deleteUser: (username: string) => Promise<void>;
};
