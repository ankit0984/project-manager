import { checkAdminPrivilege } from "@/utils/isAdmin";
import { ApiError } from "./apiError";
import logger from "@/logger/logger";

function extractToken(request) {
	const cookieToken = request?.cookies?.get?.("token")?.value;
	const authHeader = request?.headers?.get?.("authorization") || request?.headers?.get?.("Authorization");
	const bearerToken = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
	return cookieToken || bearerToken;
}

export default async function EnsureAdmin(request) {
	const token = extractToken(request);
	logger.debug(`Token extraction: hasToken=${!!token}`);

	if (!token) {
		logger.warn("Missing authentication token", {
			hasCookies: !!request?.cookies,
			cookieKeys: request?.cookies ? Array.from(request.cookies.keys()) : [],
		});
		throw ApiError.from(request, 401, "Missing authentication token or unauthorized", ["token_missing"]);
	}

	try {
		const adminCheck = await checkAdminPrivilege(request, token);

		if (!adminCheck) {
			throw ApiError.from(request, 500, "Admin check did not return a result", ["admin_check_failed"]);
		}

		if (!adminCheck.isAdmin) {
			const is401 = adminCheck.status === 401;
			const message = is401 ? adminCheck.error || "Token expired"
				: adminCheck.error ? `${adminCheck.error} - Admins Only` : "Forbidden - Admins Only";
			const code = is401 ? ["token_expired"] : adminCheck.errors || ["not_admin"];
			const err = ApiError.from(request, is401 ? 401 : 403, message, code);
			if (is401) err.clearCookie = true;
			throw err;
		}

		return adminCheck;
	} catch (err) {
		if (err instanceof ApiError) {
			if (err.statusCode === 401) err.clearCookie = true;
			throw err;
		}
		throw ApiError.from(
			request,
			500,
			err?.message || "Something went wrong during admin verification",
			[err?.message || "internal_error"],
			{ originalErrorName: err?.name || "Error", originalMessage: err?.message || String(err) },
		);
	}
}
