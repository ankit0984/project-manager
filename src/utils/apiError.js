class ApiError extends Error {
	constructor(
		statusCode = 500,
		message = "Something went wrong",
		errors = [],
		meta = {},
		stack = "",
	) {
		super(message);

		this.name = "ApiError";
		this.statusCode = statusCode;
		this.success = false;
		this.message = message;
		this.errors = errors;
		this.data = null;

		// auto metadata
		this.meta = {
			timestamp: new Date().toISOString(),
			...meta,
		};

		if (stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Create ApiError with metadata taken from NextRequest.
	 */
	static from(
		req,
		statusCode = 500,
		message = "Something went wrong",
		errors = [],
		extraMeta = {},
	) {
		const meta = {
			method: req.method,
			url: req.nextUrl?.href || req.url,
			path: req.nextUrl?.pathname,
			query: Object.fromEntries(req.nextUrl?.searchParams || []),
			ip: req.headers.get("x-forwarded-for") || "unknown",
			userId: req.userId || null, // OPTIONAL: attach userId earlier in middleware
			...extraMeta,
		};

		return new ApiError(statusCode, message, errors, meta);
	}

	/**
	 * Output safe JSON for API response
	 */
	toJSON() {
		return {
			success: this.success,
			statusCode: this.statusCode,
			message: this.message,
			errors: this.errors,
			meta: this.meta,
			stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
			data: this.data,
		};
	}
}

export { ApiError };
