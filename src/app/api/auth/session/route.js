import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { tokenSecret } from "@/env_config/env_conf";
import { connectionDb } from "@/config/db_config";
import SessionModel from "@/models/session.model";

export async function GET(request) {
	try {
		await connectionDb();

		const token = request.cookies.get("token")?.value;

		if (!token) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const decoded = jwt.verify(token, tokenSecret);

		const sessions = await SessionModel.find({
			userId: decoded.id,
		}).sort({ createdAt: -1 });

		return NextResponse.json({ sessions });
	} catch (error) {
		return NextResponse.json(
			{ message: "Error fetching sessions", error },
			{ status: 500 },
		);
	}
}

export async function DELETE(request) {
	try {
		await connectionDb();

		const token = request.cookies.get("token")?.value;

		if (!token) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const decoded = jwt.verify(token, tokenSecret);
		const body = await request.json();
		const { sessionId, logoutAll } = body;

		if (logoutAll) {
			const currentSessionId = request.cookies.get("sessionId")?.value;
			await SessionModel.deleteMany({
				userId: decoded.id,
				_id: { $ne: currentSessionId },
			});

			return NextResponse.json({
				success: true,
				message: "All other sessions logged out",
			});
		}

		if (sessionId) {
			const session = await SessionModel.findById(sessionId);

			if (!session) {
				return NextResponse.json(
					{ success: false, message: "Session not found" },
					{ status: 404 },
				);
			}

			if (session.userId.toString() !== decoded.id) {
				return NextResponse.json(
					{ success: false, message: "Unauthorized" },
					{ status: 403 },
				);
			}

			await SessionModel.findByIdAndDelete(sessionId);

			return NextResponse.json({
				success: true,
				message: "Session logged out",
			});
		}

		return NextResponse.json(
			{ success: false, message: "sessionId or logoutAll required" },
			{ status: 400 },
		);
	} catch (error) {
		console.error("Session logout error:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to logout session" },
			{ status: 500 },
		);
	}
}
