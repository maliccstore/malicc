import { GraphQLError } from "graphql";

export enum AppErrorCode {
    BAD_USER_INPUT = "BAD_USER_INPUT",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    UNAUTHENTICATED = "UNAUTHENTICATED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
}

export class AppError extends GraphQLError {
    constructor(
        message: string,
        code: AppErrorCode = AppErrorCode.INTERNAL_SERVER_ERROR,
        extensions?: Record<string, any>
    ) {
        super(message, {
            extensions: {
                code,
                ...extensions,
            },
        });
    }
}

export class AppValidationError extends AppError {
    constructor(message: string, validationErrors?: Record<string, string>[]) {
        super(message, AppErrorCode.BAD_USER_INPUT, {
            validationErrors,
        });
    }
}

export class AppDatabaseError extends AppError {
    constructor(message: string = "A database error occurred") {
        // In production, we might want to hide the specific message for security,
        // but for now, we'll keep it safely wrapped.
        super(message, AppErrorCode.INTERNAL_SERVER_ERROR);
    }
}
