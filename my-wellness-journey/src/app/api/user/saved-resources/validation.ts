import { isRequired } from "@/middleware/validation";

export const saveResourceValidationSchema = {
    resourceId: [isRequired("Resource ID")],
}; 