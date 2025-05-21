"use client";

import React from "react";
import { toast } from "react-hot-toast";
import LoginPrompt from "./LoginPrompt";

export const showLoginPrompt = () => {
	toast.error("Please log in to save tips", {
		duration: 3000,
	});
	toast.custom(<LoginPrompt />, {
		duration: 5000,
	});
}; 