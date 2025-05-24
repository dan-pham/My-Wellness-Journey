export interface CreateUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface CreateUserResponse {
    success: true;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        createdAt: Date;
    };
}

export type CreateUserError = {
    error: string;
} | {
    errors: {
        [key: string]: string[];
    };
}

export interface MongoError extends Error {
    code?: number;
} 