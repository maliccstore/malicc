import { GraphQLError, GraphQLFormattedError } from "graphql";
import { ValidationError as SequelizeValidationError, DatabaseError as SequelizeDatabaseError } from "sequelize";
import { AppError, AppErrorCode, AppValidationError } from "../errors/AppError";

export const formatGraphQLError = (
    formattedError: GraphQLFormattedError,
    error: any
): GraphQLFormattedError => {
    // Definesive unwrapping of the original error
    const originalError = error.originalError || error.extensions?.exception?.originalError || error;

    // 1. Handle Sequelize Validation Errors
    if (originalError instanceof SequelizeValidationError) {
        const validationErrors = originalError.errors.map((err) => ({
            field: err.path || "unknown",
            message: err.message,
        }));

        return new AppValidationError("Validation error", validationErrors).toJSON();
    }

    // 2. Handle Sequelize Database Errors (e.g. unique constraint errors not caught by validation)
    if (originalError instanceof SequelizeDatabaseError) {
        // Log the full error for debugging
        console.error("Database Error:", originalError);

        // Hide implementation details from client
        return new AppError(
            "Internal server error",
            AppErrorCode.INTERNAL_SERVER_ERROR
        ).toJSON();
    }

    // 3. Handle AppErrors (our custom structured errors)
    if (originalError instanceof AppError) {
        return formattedError;
    }

    // 4. Handle Authenticated/Forbidden errors (usually thrown by authChecker)
    // If it's already a GraphQLError with a code, pass it through (Apollo handles these well usually)
    if (originalError instanceof GraphQLError) {
        return formattedError;
    }

    // 5. Catch-all for other unexpected errors
    console.error("Unexpected Error:", originalError);

    // In production, mask the error
    if (process.env.NODE_ENV === "production") {
        return new AppError(
            "Something went wrong",
            AppErrorCode.INTERNAL_SERVER_ERROR
        ).toJSON();
    }

    // In development, return the formatted error (which includes stack trace by default if enabled in Apollo)
    return formattedError;
};
