import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import Team from "@/models/teams.model";
import User from "@/models/users.model";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET(request) {
	try {
		await connectionDb();
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const decoded = verify(token, process.env.TOKEN_SECRET);
		const user = await User.findById(decoded.id);

		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const teams = await Team.find()
			.populate("members", "full_name email job_title department")
			.populate("createdBy", "full_name email")
			.sort({ createdAt: -1 });

		return NextResponse.json({ teams }, { status: 200 });
	} catch (error) {
		console.error("Teams GET Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function POST(request) {
	try {
		await connectionDb();
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const decoded = verify(token, process.env.TOKEN_SECRET);
		const user = await User.findById(decoded.id);

		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { name, members } = await request.json();

		if (!name) {
			return NextResponse.json(
				{ error: "Team name is required" },
				{ status: 400 },
			);
		}

		const team = await Team.create({
			name,
			members: members || [],
			createdBy: user._id,
		});

		if (members && members.length > 0) {
			await User.updateMany({ _id: { $in: members } }, { teamId: team._id });
		}

		const populatedTeam = await Team.findById(team._id)
			.populate("members", "full_name email job_title department")
			.populate("createdBy", "full_name email");

		return NextResponse.json({ team: populatedTeam }, { status: 201 });
	} catch (error) {
		console.error("Teams POST Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
