import { tokenSecret } from "@/env_config/env_conf";
import jwt from "jsonwebtoken";

export const JwtTokenData = (request) => {
	try {
		const token = request.cookies.get("token")?.value || "";
		const decodedtoken = jwt.verify(token, tokenSecret);
		return decodedtoken;
	} catch (error) {
		throw new Error(error.message);
	}
};
