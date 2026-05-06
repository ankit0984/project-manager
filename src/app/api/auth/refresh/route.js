import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { tokenSecret } from "@/env_config/env_conf";
import { connectionDb } from "@/config/db_config";
import UsersModel from "@/models/users.model";
import SessionModel from "@/models/session.model";

export async function POST(request) {
	try {
		await connectionDb();

		const refreshToken = request.cookies.get("refreshToken")?.value;
		const sessionId = request.cookies.get("sessionId")?.value;

		if (!refreshToken) {
			return NextResponse.json(
				{ success: false, message: "Refresh token not found" },
				{ status: 401 },
			);
		}

		if (!sessionId) {
			return NextResponse.json(
				{ success: false, message: "Session not found" },
				{ status: 401 },
			);
		}

		// Verify refresh token
		let decoded;
		try {
			decoded = jwt.verify(refreshToken, tokenSecret);
		} catch (error) {
			return NextResponse.json(
				{ success: false, message: "Invalid or expired refresh token" },
				{ status: 401 },
			);
		}

		// Check if user exists and refresh token matches
		const user = await UsersModel.findById(decoded.id);

		if (!user) {
			return NextResponse.json(
				{ success: false, message: "User not found" },
				{ status: 404 },
			);
		}

		if (user.refreshToken !== refreshToken) {
			return NextResponse.json(
				{ success: false, message: "Refresh token mismatch" },
				{ status: 401 },
			);
		}

		// Check if session exists and is valid
		const session = await SessionModel.findById(sessionId);

		if (!session) {
			return NextResponse.json(
				{ success: false, message: "Session expired or invalid" },
				{ status: 401 },
			);
		}

		if (session.userId.toString() !== decoded.id) {
			return NextResponse.json(
				{ success: false, message: "Session user mismatch" },
				{ status: 401 },
			);
		}

		// Update session lastActive
		await SessionModel.findByIdAndUpdate(sessionId, {
			lastActive: new Date(),
		});

		// Generate new access token
		const tokenData = {
			id: user._id,
			role: user.role,
			isAdmin: user.isAdmin,
		};

		const newAccessToken = jwt.sign(tokenData, tokenSecret, {
			expiresIn: "1d",
		});

		const response = NextResponse.json({
			success: true,
			message: "Access token refreshed successfully",
		});

		response.cookies.set("token", newAccessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV !== "development",
			sameSite: "strict",
			path: "/",
			maxAge: 60 * 60 * 24, // 1 day
		});

		return response;
	} catch (error) {
		console.error("Refresh token error:", error);
		return NextResponse.json(
			{ success: false, message: "Token refresh failed" },
			{ status: 500 },
		);
	}
}
