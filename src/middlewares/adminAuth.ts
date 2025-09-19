import { AuthenticationError, ForbiddenError } from "../errors/";
import { Context } from "../api/graphql/context";

import { UserRole } from "../enums/UserRole";

export const requireAdmin = (context: Context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }

  if (
    context.user.role !== UserRole.ADMIN &&
    context.user.role !== UserRole.SUPER_ADMIN
  ) {
    throw new ForbiddenError("Admin access required");
  }
};

export const requireSuperAdmin = (context: Context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }

  if (context.user.role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenError("Super admin access required");
  }
};
