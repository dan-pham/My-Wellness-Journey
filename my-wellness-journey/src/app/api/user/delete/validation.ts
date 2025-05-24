import { isRequired } from "@/middleware/validation";

export const deleteUserValidationSchema = {
	password: [isRequired("Password")],
};
