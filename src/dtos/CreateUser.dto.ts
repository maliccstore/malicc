import { UserType } from "@/types/user";

export type CreateUserDTO = Omit<UserType, "id" | "createdAt" | "updatedAt">;
