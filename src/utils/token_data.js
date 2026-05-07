import jwt from "jsonwebtoken";

export const JwtTokenData = (request) => {
	try {
		const token = request.cookies.get("token")?.value || "";
		const decodedtoken = jwt.verify(token, process.env.TOKEN_SECRET);
		return decodedtoken;
	} catch (error) {
		throw new Error(error.message);
	}
};
