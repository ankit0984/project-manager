import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import UsersModel from "@/models/users.model";
import { JwtTokenData } from "@/utils/token_data";
import SessionModel from "@/models/session.model";

export async function GET(request) {
	try {
		await connectionDb();

		const token = request.cookies.get("token")?.value;

		if (!token) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		let decoded;
		try {
			decoded = JwtTokenData(request);
		} catch (err) {
			return NextResponse.json(
				{ success: false, error: "Invalid token", err },
				{ status: 401 },
			);
		}

		const userId = decoded.id;

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: "User ID not found" },
				{ status: 401 },
			);
		}

		const user = await UsersModel.findById(userId).select(
			"-password -isverified -__v",
		);

		if (!user) {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 },
			);
		}

		const sessions = await SessionModel.find({
			userId: userId,
		}).sort({ createdAt: -1 });

		return NextResponse.json({
			message: "User found",
			success: true,
			data: {
				user,
				session: sessions,
			},
		});
	} catch (error) {
		console.error("user_profile error:", error);

		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 },
		);
	}
}
