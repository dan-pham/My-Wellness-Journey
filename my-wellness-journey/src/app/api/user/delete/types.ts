export interface DeleteUserRequest {
	password: string;
}

export interface DeleteUserResponse {
	success: true;
	message: string;
}

export type DeleteUserError = { error: string } | { errors: { [key: string]: string[] } };
