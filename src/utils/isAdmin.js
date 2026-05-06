import UsersModel from "@/models/users.model";
import { JwtTokenData } from "./token_data";
import logger from "@/logger/logger";
import jwt from "jsonwebtoken";

export async function checkAdminPrivilege(request, token = null) {
	try {
		// Use provided token or extract from request
		let decoded;
		if (token) {
			// Verify the provided token directly
			decoded = jwt.verify(token, process.env.TOKEN_SECRET);
		} else {
			// Fallback to reading from cookies
			decoded = JwtTokenData(request);
		}

		if (!decoded?.id) {
			console.log("⚠️ Invalid or missing token in admin check");
			logger.warn("⚠️ Invalid or missing token in admin check");
			return { isAdmin: false, error: "Invalid token", status: 401 };
		}

		// ✅ If JWT already includes `isAdmin`, trust it
		if (decoded.isAdmin !== "undefined") {
			if (decoded.isAdmin) {
				return { isAdmin: true, user: decoded };
			} else {
				return {
					isAdmin: false,
					error: "Access Denied: Admins Only",
					status: 403,
				};
			}
		}

		// 🧭 Otherwise verify via DB
		const user = await UsersModel.findById(decoded.id).select(
			"isAdmin username email",
		);

		if (!user) {
			return { isAdmin: false, error: "User not found", status: 401 };
		}

		if (!user.isAdmin) {
			return {
				isAdmin: false,
				error: "Access Denied: Admins Only",
				status: 403,
			};
		}

		return { isAdmin: true, user };
	} catch (error) {
		// Log the actual error for debugging
		console.error("Error in checkAdminPrivilege:", error);
		logger.error(`Error in checkAdminPrivilege: ${error.message}`, {
			error: error.stack,
		});

		// If it's a JWT error, return appropriate status
		if (
			error.name === "JsonWebTokenError" ||
			error.name === "TokenExpiredError"
		) {
			return {
				isAdmin: false,
				error: error.message || "Invalid or expired token",
				status: 401,
			};
		}

		return {
			isAdmin: false,
			error: "Internal Server Error",
			status: 500,
		};
	}
}
