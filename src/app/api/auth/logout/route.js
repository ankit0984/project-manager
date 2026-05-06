import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import SessionModel from "@/models/session.model";
import UsersModel from "@/models/users.model";
import { JwtTokenData } from "@/utils/token_data";

export async function POST(request) {
	try {
		await connectionDb();

		const sessionId = request.cookies.get("sessionId")?.value;

		// Clear refresh token from database
		try {
			const decoded = JwtTokenData(request);
			await UsersModel.findByIdAndUpdate(decoded.id, {
				refreshToken: null,
			});
		} catch (error) {
			console.error("Error clearing refresh token:", error);
		}

		// Delete session from DB
		if (sessionId) {
			await SessionModel.findByIdAndDelete(sessionId);
		}

		const response = NextResponse.json({
			message: "Logout successfully!",
			success: true,
		});

		// Clear all cookies
		response.cookies.set("token", "", {
			httpOnly: true,
			expires: new Date(0),
			sameSite: "strict",
			path: "/",
		});

		response.cookies.set("refreshToken", "", {
			httpOnly: true,
			expires: new Date(0),
			sameSite: "strict",
			path: "/",
		});

		response.cookies.set("sessionId", "", {
			httpOnly: true,
			expires: new Date(0),
			sameSite: "strict",
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json({ message: "Logout failed" }, { status: 500 });
	}
}
