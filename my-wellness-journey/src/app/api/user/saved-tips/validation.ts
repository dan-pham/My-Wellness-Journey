import { isRequired } from "@/middleware/validation";

export const saveTipValidationSchema = {
	tipId: [isRequired("Tip ID")],
};
